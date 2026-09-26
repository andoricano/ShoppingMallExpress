-- ============================================================
-- Mall v3 cutover (Phase 8 part): legacy contraction
--
-- NOT a migration. This file lives outside supabase/migrations on purpose:
-- `supabase db push` applies every pending migration, and this REMOVES v2
-- objects and changes the meaning of existing data. It is applied only at the
-- v3 cutover (docs/mall1/v3/PHASES.md 2.3), on the user's explicit
-- instruction, AFTER
--   1. the migrations 20260926130000 .. 20260926190000 are applied, and
--   2. supabase/cutover/v3_stock_and_sellability.sql was applied (stock
--      conversion, sellability), and
--   3. the v3 applications (flag NEXT_PUBLIC_MALL_V3=true, or the contraction
--      code branch) are deployed together with it,
-- because the v2 applications call the objects removed here.
--
-- Run it inside ONE transaction, e.g.
--   psql --single-transaction -v ON_ERROR_STOP=1 -f <this file>
-- (no BEGIN/COMMIT in this file so that a test harness can wrap it).
--
-- Guarded: it refuses to run (and changes nothing) while
--   * an Order is PENDING or PAID without payment evidence (an unpaid v2
--     PENDING Order, or a manually marked PAID Order). The v3 lifecycle has no
--     unpaid Orders: these must be cancelled or resolved first (a production
--     data decision for Phase 9, never made by this file);
--   * a Ware's reservation does not match its Orders (the stock conversion was
--     not applied or is inconsistent);
--   * a Refund request has a status outside REQUESTED / APPROVED / REJECTED.
--
-- What it does
--   1. PAID lifecycle (BR-24): links each paid v2 Order to its Payment
--      (orders.payment_id; payments.order_id stays as the mirrored direction,
--      IN-10) and maps PAID to PENDING (both already hold their reservation);
--      orders_status_valid loses PAID.
--   2. Removes the v2 order paths that v3 replaces:
--        create_order_from_cart        -> checkout payment + finalize_order
--        cancel_order                  -> cancel_pending_order
--        request_refund                -> create_refund_request
--        admin_transition_order_status -> admin_advance_order
--        admin_transition_refund_status-> admin_decide_refund
--        restock_order_item            -> admin_restock_refund_item (Policy B)
--   3. create_payment / complete_payment keep only POINT_TOPUP (the Point
--      top-up UI is hidden in v3 but its data and RPCs are retained, DN-49);
--      ORDER_PAYMENT is refused (finalize_order is the only Order path).
--   4. Validates the Refund status CHECK (DN-47).
--   5. get_product_variant_availability reports the v3 status SOLD_OUT.
-- ============================================================

do $$
declare
    v_unpaid bigint;
    v_mismatch bigint;
    v_refunds bigint;
begin
    select count(*) into v_unpaid
    from public.orders o
    where o.status in ('PENDING', 'PAID')
      and o.payment_id is null
      and not exists (
          select 1 from public.payments p
          where p.order_id = o.id and p.status = 'SUCCEEDED'
      );

    if v_unpaid > 0 then
        raise exception
            'Contraction refused: % PENDING/PAID Order(s) have no succeeded Payment (cancel or resolve them first)',
            v_unpaid;
    end if;

    select count(*) into v_mismatch
    from public.wares w
    left join (
        select a.ware_id, sum(a.quantity)::bigint as quantity
        from public.order_item_ware_allocations a
        join public.order_items oi on oi.id = a.order_item_id
        join public.orders o on o.id = oi.order_id
        where o.status in ('PENDING', 'PAID')
        group by a.ware_id
    ) h on h.ware_id = w.id
    where w.reserved_stock <> coalesce(h.quantity, 0)
       or w.reserved_stock > w.current_stock;

    if v_mismatch > 0 then
        raise exception
            'Contraction refused: the stock conversion is missing or inconsistent for % Ware(s)',
            v_mismatch;
    end if;

    select count(*) into v_refunds
    from public.refund_requests
    where status not in ('REQUESTED', 'APPROVED', 'REJECTED');

    if v_refunds > 0 then
        raise exception
            'Contraction refused: % Refund request(s) have a status outside REQUESTED/APPROVED/REJECTED',
            v_refunds;
    end if;
end;
$$;

-- 1. PAID lifecycle -------------------------------------------------------
update public.orders o
   set payment_id = p.id
  from public.payments p
 where p.order_id = o.id
   and p.status = 'SUCCEEDED'
   and p.purpose = 'ORDER_PAYMENT'
   and o.payment_id is null
   and not exists (select 1 from public.orders x where x.payment_id = p.id);

update public.orders
   set status = 'PENDING'
 where status = 'PAID';

alter table public.orders drop constraint orders_status_valid;
alter table public.orders
    add constraint orders_status_valid
    check (status in ('PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'));

-- 2. Remove the v2 order paths ---------------------------------------------
drop function public.create_order_from_cart(jsonb, text);
drop function public.cancel_order(uuid);
drop function public.request_refund(uuid, jsonb, text);
drop function public.admin_transition_order_status(uuid, text);
drop function public.admin_transition_refund_status(uuid, text);
drop function public.restock_order_item(uuid, uuid, bigint);

-- 3. Payments: POINT_TOPUP only --------------------------------------------
create or replace function public.create_payment(
    p_client_id uuid,
    p_purpose text,
    p_order_id uuid default null,
    p_amount numeric default null
)
returns public.payments
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_payment public.payments;
begin
    if p_client_id is null then
        raise exception 'Authentication required';
    end if;

    if p_purpose = 'ORDER_PAYMENT' then
        raise exception 'Order payments use the checkout payment and finalize_order';
    end if;

    if p_purpose <> 'POINT_TOPUP' then
        raise exception 'Unsupported payment purpose: %', p_purpose;
    end if;

    if p_order_id is not null then
        raise exception 'Point top-up does not take an order';
    end if;

    if p_amount is null
       or p_amount <> trunc(p_amount)
       or p_amount < 1000
       or p_amount > 1000000
       or mod(p_amount, 1000) <> 0 then
        raise exception
            'Point top-up amount must be 1,000 to 1,000,000 in units of 1,000';
    end if;

    insert into public.payments (client_id, purpose, order_id, amount)
    values (p_client_id, p_purpose, null, p_amount)
    returning * into v_payment;

    return v_payment;
end;
$$;

create or replace function public.complete_payment(
    p_client_id uuid,
    p_payment_id uuid,
    p_succeeded boolean,
    p_pg_callback_id text default null,
    p_failure_reason text default null
)
returns public.payments
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_payment public.payments;
    v_balance bigint;
begin
    if p_client_id is null then
        raise exception 'Authentication required';
    end if;

    if p_succeeded is null then
        raise exception 'Payment result is required';
    end if;

    select p.* into v_payment
    from public.payments p
    where p.id = p_payment_id
      and p.client_id = p_client_id
    for update;

    if v_payment.id is null then
        raise exception 'Payment not found' using errcode = 'P0002';
    end if;

    if v_payment.purpose <> 'POINT_TOPUP' then
        raise exception 'Order payments use complete_checkout_payment';
    end if;

    if v_payment.status <> 'PENDING' then
        return v_payment;
    end if;

    if not p_succeeded then
        update public.payments
           set status = 'FAILED',
               pg_callback_id = p_pg_callback_id,
               failure_reason = coalesce(p_failure_reason, 'PG test payment failed'),
               completed_at = now()
         where id = v_payment.id
        returning * into v_payment;

        return v_payment;
    end if;

    insert into public.point_balances (client_id, balance)
    values (p_client_id, 0)
    on conflict (client_id) do nothing;

    update public.point_balances
       set balance = balance + v_payment.amount::bigint
     where client_id = p_client_id
    returning balance into v_balance;

    insert into public.point_ledger (client_id, type, amount, balance_after, payment_id)
    values (p_client_id, 'TOPUP', v_payment.amount::bigint, v_balance, v_payment.id);

    update public.payments
       set status = 'SUCCEEDED',
           pg_callback_id = p_pg_callback_id,
           failure_reason = null,
           completed_at = now()
     where id = v_payment.id
    returning * into v_payment;

    return v_payment;
end;
$$;

-- 4. Refund status set (DN-47) ----------------------------------------------
alter table public.refund_requests validate constraint refund_requests_status_v3_valid;

-- 5. The Consumer sellability contract names the explicit state SOLD_OUT ------
create or replace function public.get_product_variant_availability(
    p_product_variant_id uuid
)
returns table (
    product_variant_id uuid,
    is_available       boolean,
    stock_status       text
)
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
    select s.product_variant_id, s.is_available, s.sellability_status
    from public.get_product_variant_sellability(p_product_variant_id) s;
$$;
