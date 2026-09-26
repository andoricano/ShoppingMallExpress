-- ============================================================
-- Mall v3 - Phase 4: Stage 2 finalize (payment-first checkout)
--
-- Source: docs/mall1/v3/PHASES.md (Phase 4),
--         docs/mall1/v3/BUSINESS_LOGIC_AND_SCENARIOS.md
--         (BR-01 .. BR-05, BR-09, BR-25, BR-27, BR-43 .. BR-47, BR-49;
--          S-01 .. S-11, S-26).
--
-- Additive only. create_order_from_cart, create_payment,
-- complete_payment and every other v2 object are untouched: the v2
-- runtime keeps working until the v3 cutover (PHASES.md 2.2).
-- The v3 path uses its own functions:
--
--   create_checkout_payment   Stage 1: the server determines the amount from
--                             the submitted items and records ONLY a Payment
--                             (no Order, no items; BR-44). Not-sellable items
--                             are refused before any PG interaction (S-04).
--   complete_checkout_payment records the PG result of an Order-less Payment
--                             (PENDING -> SUCCEEDED | FAILED). It never
--                             touches an Order and never overwrites a PG
--                             success (CF-15).
--   finalize_order            Stage 2. One database transaction: lock the
--                             Payment, return the existing Order for a repeat,
--                             revalidate sellability and the price, then EITHER
--                             create the PENDING Order (snapshots, allocation
--                             of what can be secured, Payment link) OR create
--                             the FINALIZE_FAILURE reversal and no Order.
--   reverse_orphan_payments   Starts an ORPHAN_PAYMENT reversal for succeeded
--                             Payments that were never finalized.
--
-- Decisions inside Phase 4 (implementation; policy stays as approved)
--   IN-10  One Order per Payment: orders.payment_id UNIQUE (Phase 1) is the
--          structural guarantee; finalize additionally locks the Payment row,
--          so a repeated or concurrent finalize returns the existing Order.
--          payments.order_id is set in the same transaction so the two
--          directions never disagree (it is removed/decided in Phase 8).
--          The webhook route is not built here: no PG webhook contract exists
--          (PG Test has none) and the DB-level idempotency above already makes
--          a webhook-driven repeat safe (S-11).
--   IN-11  Orphan detection: a SUCCEEDED, Order-less ORDER_PAYMENT older than
--          a window (default 30 minutes, a parameter) that has no closing
--          reversal gets an ORPHAN_PAYMENT reversal, under the Payment row
--          lock (FOR UPDATE SKIP LOCKED), so it cannot race a finalize. The
--          scheduling mechanism is a deployment matter (Phase 9).
--   DN-38  The window above is a default to confirm, not a fixed policy.
--   DN-39  A transient finalize failure rolls the whole transaction back: the
--          Payment stays SUCCEEDED with no Order and no reversal. The Client
--          retries (it holds the items, BR-44); if it never does, the orphan
--          rule above is the backstop. No attempt state is stored.
--   DN-41  Zero-amount Orders are not created in the initial v3: a checkout
--          total must be greater than zero (a Payment amount is > 0).
--   DN-23  finalize does not touch the server Cart (the Client owns Stage 1).
--          Cart handling is aligned with the Consumer surfaces in Phase 8.
--   DN-19/20/24  Client-facing wording, PG-failure retry UX, and showing an
--          in-progress Payment are Consumer-surface items (Phase 8). The
--          functions return machine-readable outcomes/reasons only.
--
-- A closing decision is made once per Payment: FINALIZE_FAILURE and
-- ORPHAN_PAYMENT reversals are mutually exclusive, and neither can exist for
-- a Payment that has an Order (guard trigger below), so a finalize and a
-- reversal never create duplicate money movement (BR-34 still bounds the sum).
--
-- Lock order: Payment -> (Order -> OrderItem -> Ware by id).
-- ============================================================

-- ------------------------------------------------------------
-- Guard: a Payment is closed by an Order OR by one closing reversal
-- ------------------------------------------------------------
create or replace function public.enforce_payment_closing_reversal_rule()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_payment public.payments;
begin
    if new.reason_type not in ('FINALIZE_FAILURE', 'ORPHAN_PAYMENT') then
        return new;
    end if;

    select p.* into v_payment
    from public.payments p
    where p.id = new.payment_id
    for no key update;

    if v_payment.id is null then
        return new; -- the foreign key reports the missing Payment
    end if;

    if v_payment.order_id is not null
       or exists (select 1 from public.orders o where o.payment_id = new.payment_id) then
        raise exception 'A Payment that has an Order cannot get a % reversal', new.reason_type
            using errcode = '23514';
    end if;

    if exists (
        select 1
        from public.payment_reversals r
        where r.payment_id = new.payment_id
          and r.reason_type in ('FINALIZE_FAILURE', 'ORPHAN_PAYMENT')
          and r.id <> new.id
    ) then
        raise exception 'This Payment already has a finalization-closing reversal'
            using errcode = '23514';
    end if;

    return new;
end;
$$;

create trigger payment_reversals_enforce_closing_rule
    before insert on public.payment_reversals
    for each row execute function public.enforce_payment_closing_reversal_rule();

revoke all on function public.enforce_payment_closing_reversal_rule()
    from public, anon, authenticated;


-- ------------------------------------------------------------
-- v3_resolve_checkout_items(items)
--
-- Internal. Validates the SHAPE of the submitted items (a malformed request
-- raises: it is a caller error, not a business failure) and resolves each
-- item against the database: trusted price, snapshots, sellability.
-- The Client price is never read.
--
-- items: [{ "productId": uuid, "productVariantId": uuid, "quantity": int }]
--
-- not_sellable_reason: NULL when sellable, otherwise NOT_FOUND | SALE_DISABLED
-- | SOLD_OUT | NOT_PUBLISHED (BR-03, BR-46). Numeric stock is never read
-- (BR-04).
-- ------------------------------------------------------------
create or replace function public.v3_resolve_checkout_items(
    p_items jsonb
)
returns table (
    item_index          integer,
    product_id          uuid,
    product_variant_id  uuid,
    quantity            integer,
    unit_price          numeric,
    line_total          numeric,
    product_name        text,
    variant_label       text,
    image_url           text,
    option_snapshot     jsonb,
    not_sellable_reason text
)
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
    v_item jsonb;
    v_index integer := 0;
    v_product uuid;
    v_variant uuid;
    v_quantity integer;
    v_seen uuid[] := array[]::uuid[];
    v_row record;
begin
    if p_items is null
       or jsonb_typeof(p_items) <> 'array'
       or jsonb_array_length(p_items) = 0 then
        raise exception 'Items must be a non-empty array';
    end if;

    if jsonb_array_length(p_items) > 100 then
        raise exception 'Too many items';
    end if;

    for v_item in select value from jsonb_array_elements(p_items)
    loop
        v_index := v_index + 1;

        if jsonb_typeof(v_item) <> 'object' then
            raise exception 'Invalid item %', v_index;
        end if;

        begin
            v_product := (v_item ->> 'productId')::uuid;
            v_variant := (v_item ->> 'productVariantId')::uuid;
            v_quantity := (v_item ->> 'quantity')::integer;
        exception when others then
            raise exception 'Invalid item %', v_index;
        end;

        if v_product is null or v_variant is null
           or v_quantity is null or v_quantity < 1 or v_quantity > 9999 then
            raise exception 'Invalid item %', v_index;
        end if;

        if v_variant = any (v_seen) then
            raise exception 'Duplicate ProductVariant in items';
        end if;

        v_seen := v_seen || v_variant;

        select
            p.name as product_name,
            p.image_urls[1] as image_url,
            pv.label as variant_label,
            pv.price as unit_price,
            pv.is_active as variant_active,
            p.is_active as product_active,
            pv.is_sold_out as sold_out,
            exists (
                select 1
                from public.product_post_products ppp
                join public.product_posts pp on pp.id = ppp.product_post_id
                where ppp.product_id = p.id
                  and pp.status = 'PUBLISHED'
                  and (pp.published_at is null or pp.published_at <= now())
            ) as published
        into v_row
        from public.product_variants pv
        join public.products p on p.id = pv.product_id
        where pv.id = v_variant
          and pv.product_id = v_product;

        item_index := v_index;
        product_id := v_product;
        product_variant_id := v_variant;
        quantity := v_quantity;

        if not found then
            unit_price := 0;
            line_total := 0;
            product_name := null;
            variant_label := null;
            image_url := null;
            option_snapshot := '[]'::jsonb;
            not_sellable_reason := 'NOT_FOUND';
            return next;
            continue;
        end if;

        unit_price := v_row.unit_price;
        line_total := v_row.unit_price * v_quantity;
        product_name := v_row.product_name;
        variant_label := v_row.variant_label;
        image_url := v_row.image_url;

        select coalesce(
            jsonb_agg(
                jsonb_build_object(
                    'optionId', po.id,
                    'optionName', po.name,
                    'valueId', pov.id,
                    'value', pov.value
                )
                order by po.display_order, pov.display_order
            ),
            '[]'::jsonb
        )
        into option_snapshot
        from public.product_variant_values pvv
        join public.product_option_values pov on pov.id = pvv.product_option_value_id
        join public.product_options po on po.id = pov.product_option_id
        where pvv.product_variant_id = v_variant;

        not_sellable_reason := case
            when not v_row.variant_active or not v_row.product_active then 'SALE_DISABLED'
            when v_row.sold_out then 'SOLD_OUT'
            when not v_row.published then 'NOT_PUBLISHED'
            else null
        end;

        return next;
    end loop;
end;
$$;

revoke all on function public.v3_resolve_checkout_items(jsonb)
    from public, anon, authenticated;
grant execute on function public.v3_resolve_checkout_items(jsonb)
    to service_role;


-- ------------------------------------------------------------
-- create_checkout_payment(client, items)   Stage 1
--
-- Records ONLY a Payment (BR-01, BR-44): ORDER_PAYMENT, no order_id, amount
-- determined here from the trusted prices. Items that cannot be sold are
-- refused before the PG is involved (S-04). Numeric stock is not checked
-- (BR-04). The items themselves are not stored.
-- ------------------------------------------------------------
create or replace function public.create_checkout_payment(
    p_client_id uuid,
    p_items     jsonb
)
returns public.payments
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_total numeric(14, 2);
    v_blocked record;
    v_payment public.payments;
begin
    if p_client_id is null then
        raise exception 'Authentication required';
    end if;

    select r.item_index, r.product_variant_id, r.not_sellable_reason
      into v_blocked
    from public.v3_resolve_checkout_items(p_items) r
    where r.not_sellable_reason is not null
    order by r.item_index
    limit 1;

    if v_blocked.item_index is not null then
        raise exception 'Not sellable: ProductVariant % (%)',
            v_blocked.product_variant_id, v_blocked.not_sellable_reason
            using detail = v_blocked.not_sellable_reason;
    end if;

    select sum(r.line_total)::numeric(14, 2)
      into v_total
    from public.v3_resolve_checkout_items(p_items) r;

    if v_total is null or v_total <= 0 then
        raise exception 'Checkout total must be greater than zero';
    end if;

    insert into public.payments (client_id, purpose, amount)
    values (p_client_id, 'ORDER_PAYMENT', v_total)
    returning * into v_payment;

    return v_payment;
end;
$$;

revoke all on function public.create_checkout_payment(uuid, jsonb)
    from public, anon, authenticated;
grant execute on function public.create_checkout_payment(uuid, jsonb)
    to service_role;


-- ------------------------------------------------------------
-- complete_checkout_payment(client, payment, succeeded, callback, reason)
--
-- Records the PG result of an Order-less ORDER_PAYMENT. Called by the trusted
-- server after it verified the result with the PG (server confirm, the primary
-- path). Idempotent: a completed Payment is returned unchanged. It never
-- changes an Order and never rewrites a PG success (CF-15).
-- v2 Payments (with an order_id) and Point top-ups stay on complete_payment.
-- ------------------------------------------------------------
create or replace function public.complete_checkout_payment(
    p_client_id      uuid,
    p_payment_id     uuid,
    p_succeeded      boolean,
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

    if v_payment.purpose <> 'ORDER_PAYMENT' then
        raise exception 'Not a checkout Payment';
    end if;

    -- A completed Payment is returned unchanged, also after its Order exists
    -- (a repeated confirm or a webhook, S-11).
    if v_payment.status <> 'PENDING' then
        return v_payment;
    end if;

    -- A still-PENDING Payment that already points at an Order is a v2 payment.
    if v_payment.order_id is not null then
        raise exception 'Not a checkout Payment';
    end if;

    if p_succeeded and (p_pg_callback_id is null or btrim(p_pg_callback_id) = '') then
        raise exception 'PG reference is required for a successful payment';
    end if;

    update public.payments
       set status = case when p_succeeded then 'SUCCEEDED' else 'FAILED' end,
           pg_callback_id = p_pg_callback_id,
           failure_reason = case
               when p_succeeded then null
               else coalesce(p_failure_reason, 'PG payment failed')
           end,
           completed_at = now()
     where id = v_payment.id
    returning * into v_payment;

    return v_payment;
end;
$$;

revoke all on function public.complete_checkout_payment(uuid, uuid, boolean, text, text)
    from public, anon, authenticated;
grant execute on function public.complete_checkout_payment(uuid, uuid, boolean, text, text)
    to service_role;


-- ------------------------------------------------------------
-- finalize_order(client, payment, items, shipping_address)   Stage 2
--
-- Returns jsonb:
--   { "outcome": "CREATED",  "order_id", "order_number" }
--   { "outcome": "EXISTING", "order_id", "order_number" }   repeat/concurrent
--   { "outcome": "REJECTED", "reason", "reversal_id" }      no Order
-- reason: NOT_SELLABLE | PRICE_MISMATCH | ALREADY_CLOSED.
--
-- A malformed request (bad items/address shape, a Payment that has not
-- succeeded, another client's Payment) RAISES: the transaction rolls back and
-- the Payment stays SUCCEEDED and finalizable (DN-39). A business validation
-- failure does NOT raise: it commits the FINALIZE_FAILURE reversal for the full
-- Payment amount, so "PG success + no Order + no follow-up" never persists
-- (BR-27).
-- ------------------------------------------------------------
create or replace function public.finalize_order(
    p_client_id        uuid,
    p_payment_id       uuid,
    p_items            jsonb,
    p_shipping_address jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_payment public.payments;
    v_order public.orders;
    v_closing public.payment_reversals;
    v_reversal public.payment_reversals;
    v_reason text;
    v_total numeric(14, 2);
    v_item record;
    v_order_id uuid;
    v_order_item_id uuid;
    v_order_number text;
begin
    if p_client_id is null then
        raise exception 'Authentication required';
    end if;

    select p.* into v_payment
    from public.payments p
    where p.id = p_payment_id
      and p.client_id = p_client_id
    for update;

    if v_payment.id is null then
        raise exception 'Payment not found' using errcode = 'P0002';
    end if;

    if v_payment.purpose <> 'ORDER_PAYMENT' then
        raise exception 'Not an order Payment';
    end if;

    -- One Order per Payment: a repeat returns the existing Order (BR-45).
    select o.* into v_order
    from public.orders o
    where o.payment_id = v_payment.id;

    if v_order.id is not null then
        return jsonb_build_object(
            'outcome', 'EXISTING',
            'order_id', v_order.id,
            'order_number', v_order.order_number
        );
    end if;

    if v_payment.status <> 'SUCCEEDED' then
        raise exception 'Payment has not succeeded';
    end if;

    -- Already closed by a finalize failure or an orphan reversal: a late
    -- finalize cannot resurrect it.
    select r.* into v_closing
    from public.payment_reversals r
    where r.payment_id = v_payment.id
      and r.reason_type in ('FINALIZE_FAILURE', 'ORPHAN_PAYMENT')
    limit 1;

    if v_closing.id is not null then
        return jsonb_build_object(
            'outcome', 'REJECTED',
            'reason', 'ALREADY_CLOSED',
            'reversal_id', v_closing.id
        );
    end if;

    if p_shipping_address is null
       or jsonb_typeof(p_shipping_address) <> 'object'
       or p_shipping_address = '{}'::jsonb then
        raise exception 'Shipping address is required';
    end if;

    -- Revalidate: sellability first, then the price (BR-03, BR-45).
    select r.not_sellable_reason into v_reason
    from public.v3_resolve_checkout_items(p_items) r
    where r.not_sellable_reason is not null
    order by r.item_index
    limit 1;

    if v_reason is not null then
        v_reason := 'NOT_SELLABLE';
    else
        select sum(r.line_total)::numeric(14, 2) into v_total
        from public.v3_resolve_checkout_items(p_items) r;

        if v_total is distinct from v_payment.amount then
            v_reason := 'PRICE_MISMATCH';
        end if;
    end if;

    if v_reason is not null then
        v_reversal := public.create_payment_reversal(
            v_payment.id,
            v_payment.amount,
            'FINALIZE_FAILURE',
            'finalize-failure:' || v_payment.id::text
        );

        return jsonb_build_object(
            'outcome', 'REJECTED',
            'reason', v_reason,
            'reversal_id', v_reversal.id
        );
    end if;

    -- Create the Order (PENDING) and its immutable snapshots.
    v_order_number :=
        'ORD-'
        || to_char(clock_timestamp(), 'YYYYMMDDHH24MISS')
        || '-'
        || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

    insert into public.orders (
        client_id, order_number, status, shipping_address,
        subtotal, discount_amount, shipping_amount, total_amount,
        payment_reference, payment_id
    )
    values (
        p_client_id, v_order_number, 'PENDING', p_shipping_address,
        v_payment.amount, 0, 0, v_payment.amount,
        v_payment.id::text, v_payment.id
    )
    returning id into v_order_id;

    for v_item in
        select * from public.v3_resolve_checkout_items(p_items) r order by r.item_index
    loop
        insert into public.order_items (
            order_id, product_id, product_variant_id, quantity,
            unit_price, line_total, product_name_snapshot,
            variant_label_snapshot, option_snapshot, image_url_snapshot
        )
        values (
            v_order_id, v_item.product_id, v_item.product_variant_id, v_item.quantity,
            v_item.unit_price, v_item.line_total, v_item.product_name,
            v_item.variant_label, v_item.option_snapshot, v_item.image_url
        )
        returning id into v_order_item_id;
    end loop;

    -- Both directions of the Payment <-> Order link change in this
    -- transaction, so they can never disagree.
    update public.payments
       set order_id = v_order_id
     where id = v_payment.id;

    -- Lock every involved Ware in id order BEFORE allocating, so two
    -- multi-item finalizes cannot deadlock on each other.
    perform 1
    from public.wares w
    where w.id in (
        select pvw.ware_id
        from public.order_items oi
        join public.product_variant_wares pvw on pvw.product_variant_id = oi.product_variant_id
        where oi.order_id = v_order_id
    )
    order by w.id
    for update;

    -- Reserve what can be secured; the rest is shortage (BR-04, BR-09).
    perform public.allocate_order_stock(v_order_id);

    return jsonb_build_object(
        'outcome', 'CREATED',
        'order_id', v_order_id,
        'order_number', v_order_number
    );
end;
$$;

revoke all on function public.finalize_order(uuid, uuid, jsonb, jsonb)
    from public, anon, authenticated;
grant execute on function public.finalize_order(uuid, uuid, jsonb, jsonb)
    to service_role;


-- ------------------------------------------------------------
-- reverse_orphan_payments(min_age, limit)
--
-- Orphan Payment: PG success, no Order, no closing reversal, older than the
-- window. Each one gets a full-amount ORPHAN_PAYMENT reversal (BR-27, BR-44),
-- taken under the Payment row lock with SKIP LOCKED, so a finalize in flight
-- is never raced: either it wins (the Order exists and the Payment is no longer
-- an orphan) or the reversal wins (the finalize then returns ALREADY_CLOSED).
-- Idempotent per Payment. Returns what it created; executing the reversals
-- (PG call) is the executor's job.
-- ------------------------------------------------------------
create or replace function public.reverse_orphan_payments(
    p_min_age interval default interval '30 minutes',
    p_limit   integer  default 100
)
returns table (
    payment_id  uuid,
    reversal_id uuid
)
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
    v_payment record;
    v_reversal public.payment_reversals;
begin
    if p_min_age is null or p_min_age < interval '0 seconds' then
        raise exception 'Minimum age must not be negative';
    end if;

    if p_limit is null or p_limit < 1 then
        raise exception 'Limit must be positive';
    end if;

    for v_payment in
        select p.id, p.amount
        from public.payments p
        where p.purpose = 'ORDER_PAYMENT'
          and p.status = 'SUCCEEDED'
          and p.order_id is null
          and p.completed_at <= now() - p_min_age
          and not exists (select 1 from public.orders o where o.payment_id = p.id)
          and not exists (
              select 1
              from public.payment_reversals r
              where r.payment_id = p.id
                and r.reason_type in ('FINALIZE_FAILURE', 'ORPHAN_PAYMENT')
          )
        order by p.completed_at
        limit p_limit
        for update of p skip locked
    loop
        v_reversal := public.create_payment_reversal(
            v_payment.id,
            v_payment.amount,
            'ORPHAN_PAYMENT',
            'orphan:' || v_payment.id::text
        );

        payment_id := v_payment.id;
        reversal_id := v_reversal.id;
        return next;
    end loop;
end;
$$;

revoke all on function public.reverse_orphan_payments(interval, integer)
    from public, anon, authenticated;
grant execute on function public.reverse_orphan_payments(interval, integer)
    to service_role;
