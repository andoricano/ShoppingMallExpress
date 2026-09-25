-- ============================================================
-- Local verification: refund_item_restocks / admin_restock_refund_item()
-- (migration 20260925150000_refund_item_restocks.sql)
--
-- Run after `pnpm supabase db reset` against the LOCAL database:
--
--   psql "postgresql://postgres:postgres@127.0.0.1:54322/postgres" \
--     -f supabase/verification/refund_item_restocks.sql
--
-- (without a host psql: docker exec -i supabase_db_ShoppingEx \
--    psql -U postgres -d postgres -v ON_ERROR_STOP=1 \
--    < supabase/verification/refund_item_restocks.sql)
--
-- Runs in one transaction and is ROLLED BACK. Service RPCs run as the
-- owner (= trusted server boundary); consumer access runs as
-- authenticated / anon with JWT claims. Every failing restock runs in
-- its own subtransaction (= one PostgREST RPC request) and must leave
-- Ware stock and restock records unchanged.
--
-- True parallel sessions are covered by
-- refund_item_restocks_concurrency.sh.
-- ============================================================

\set ON_ERROR_STOP on

begin;

create temp table _results (
    scenario text,
    ok boolean,
    detail text
) on commit drop;

create temp table _fx (
    key text primary key,
    id uuid
) on commit drop;

grant select on _results, _fx to anon, authenticated;
grant insert on _results to anon, authenticated;

do $$
declare
    v_client uuid := gen_random_uuid();
    v_wh uuid;
    v_w1 uuid;      -- OrderItem 1 allocation (3)
    v_w2 uuid;      -- OrderItem 1 allocation (2)
    v_w3 uuid;      -- OrderItem 2 allocation (2) only
    v_w4 uuid;      -- unrelated Ware
    v_created jsonb;
    v_p1 uuid; v_var1 uuid;
    v_p2 uuid; v_var2 uuid;
    v_order uuid;
    v_oi1 uuid;     -- quantity 5 = W1 3 + W2 2
    v_oi2 uuid;     -- quantity 2 = W3 2
    v_r_req uuid; v_ri_req uuid;
    v_r_rej uuid; v_ri_rej uuid;
    v_r1 uuid;  v_ri1 uuid;   -- OrderItem 1, quantity 4
    v_r4 uuid;  v_ri4 uuid;   -- OrderItem 1, quantity 1
    v_r5 uuid;  v_ri5 uuid;   -- OrderItem 2, quantity 2
    v_restock public.refund_item_restocks;
    v_refund public.refund_requests;
    v_s1 bigint; v_s2 bigint; v_s3 bigint; v_s4 bigint;
    v_rows bigint;
    v_ok int;
    v_i int;
begin
    insert into auth.users (id) values (v_client);

    v_wh := public.create_warehouse('__verify restock warehouse');
    v_w1 := public.create_ware(v_wh, '__verify W1', null, 'GENERAL', 10);
    v_w2 := public.create_ware(v_wh, '__verify W2', null, 'GENERAL', 10);
    v_w3 := public.create_ware(v_wh, '__verify W3', null, 'GENERAL', 10);
    v_w4 := public.create_ware(v_wh, '__verify W4', null, 'GENERAL', 5);

    v_created := public.admin_create_product(
        '{"name":"__verify restock product 1"}', '[]',
        '[{"price":1000,"skuCode":"__VERIFY-RESTOCK-1"}]');
    v_p1 := (v_created ->> 'productId')::uuid;
    v_var1 := (v_created -> 'variantIds' ->> 0)::uuid;

    v_created := public.admin_create_product(
        '{"name":"__verify restock product 2"}', '[]',
        '[{"price":2000,"skuCode":"__VERIFY-RESTOCK-2"}]');
    v_p2 := (v_created ->> 'productId')::uuid;
    v_var2 := (v_created -> 'variantIds' ->> 0)::uuid;

    insert into public.orders (client_id, status, subtotal, total_amount)
    values (v_client, 'DELIVERED', 9000, 9000) returning id into v_order;

    insert into public.order_items (
        order_id, product_id, product_variant_id, quantity,
        unit_price, line_total, product_name_snapshot)
    values (v_order, v_p1, v_var1, 5, 1000, 5000, '__verify restock product 1')
    returning id into v_oi1;

    insert into public.order_items (
        order_id, product_id, product_variant_id, quantity,
        unit_price, line_total, product_name_snapshot)
    values (v_order, v_p2, v_var2, 2, 2000, 4000, '__verify restock product 2')
    returning id into v_oi2;

    insert into public.order_item_ware_allocations (order_item_id, ware_id, quantity)
    values (v_oi1, v_w1, 3), (v_oi1, v_w2, 2), (v_oi2, v_w3, 2);

    -- Refund requests (Consumer path would go through request_refund()).
    insert into public.refund_requests (order_id, client_id, status, requested_amount)
    values (v_order, v_client, 'REQUESTED', 2000) returning id into v_r_req;
    insert into public.refund_items (refund_request_id, order_item_id, quantity, refund_amount)
    values (v_r_req, v_oi2, 1, 2000) returning id into v_ri_req;

    insert into public.refund_requests (order_id, client_id, status, requested_amount)
    values (v_order, v_client, 'REQUESTED', 2000) returning id into v_r_rej;
    insert into public.refund_items (refund_request_id, order_item_id, quantity, refund_amount)
    values (v_r_rej, v_oi2, 1, 2000) returning id into v_ri_rej;

    insert into public.refund_requests (order_id, client_id, status, requested_amount)
    values (v_order, v_client, 'REQUESTED', 4000) returning id into v_r1;
    insert into public.refund_items (refund_request_id, order_item_id, quantity, refund_amount)
    values (v_r1, v_oi1, 4, 4000) returning id into v_ri1;

    insert into public.refund_requests (order_id, client_id, status, requested_amount)
    values (v_order, v_client, 'REQUESTED', 1000) returning id into v_r4;
    insert into public.refund_items (refund_request_id, order_item_id, quantity, refund_amount)
    values (v_r4, v_oi1, 1, 1000) returning id into v_ri4;

    insert into public.refund_requests (order_id, client_id, status, requested_amount)
    values (v_order, v_client, 'REQUESTED', 4000) returning id into v_r5;
    insert into public.refund_items (refund_request_id, order_item_id, quantity, refund_amount)
    values (v_r5, v_oi2, 2, 4000) returning id into v_ri5;

    insert into _fx values
        ('client', v_client), ('r1', v_r1), ('ri1', v_ri1), ('w1', v_w1);

    -- ---------------- status gate ----------------
    select current_stock into v_s1 from public.wares where id = v_w1;
    select count(*) into v_rows from public.refund_item_restocks;

    begin
        perform public.admin_restock_refund_item(v_r_req, v_ri_req, v_w3, 1);
        insert into _results values ('restock: REQUESTED refund rejected', false, 'restocked');
    exception when others then
        insert into _results values ('restock: REQUESTED refund rejected',
            sqlerrm like '%must be APPROVED%', sqlerrm);
    end;

    v_refund := public.admin_transition_refund_status(v_r_rej, 'REJECTED');
    insert into _results values ('refund: REJECTED stamps processed_at',
        v_refund.status = 'REJECTED' and v_refund.processed_at is not null, v_refund.status);

    begin
        perform public.admin_restock_refund_item(v_r_rej, v_ri_rej, v_w3, 1);
        insert into _results values ('restock: REJECTED refund rejected', false, 'restocked');
    exception when others then
        insert into _results values ('restock: REJECTED refund rejected',
            sqlerrm like '%must be APPROVED%', sqlerrm);
    end;

    select current_stock into v_s3 from public.wares where id = v_w3;
    insert into _results values ('restock: rejected states change nothing',
        v_s3 = 10 and (select count(*) from public.refund_item_restocks) = v_rows, v_s3::text);

    -- ---------------- APPROVED alone changes no stock ----------------
    insert into _results values ('refund: REQUESTED keeps processed_at NULL',
        (select processed_at is null from public.refund_requests where id = v_r1), null);

    v_refund := public.admin_transition_refund_status(v_r1, 'APPROVED');
    perform public.admin_transition_refund_status(v_r4, 'APPROVED');
    perform public.admin_transition_refund_status(v_r5, 'APPROVED');

    insert into _results values ('refund: APPROVED stamps processed_at',
        v_refund.status = 'APPROVED' and v_refund.processed_at is not null, v_refund.status);

    select current_stock into v_s2 from public.wares where id = v_w2;
    insert into _results values ('refund: APPROVED alone does not change stock',
        (select current_stock from public.wares where id = v_w1) = v_s1
        and v_s2 = 10
        and (select count(*) from public.refund_item_restocks) = v_rows, null);

    begin
        perform public.admin_transition_refund_status(v_r1, 'REJECTED');
        insert into _results values ('refund: lifecycle unchanged (APPROVED is terminal)', false, 'transitioned');
    exception when others then
        insert into _results values ('refund: lifecycle unchanged (APPROVED is terminal)',
            sqlerrm like '%cannot transition%', sqlerrm);
    end;

    -- ---------------- normal + partial restock ----------------
    v_restock := public.admin_restock_refund_item(v_r1, v_ri1, v_w1, 2);
    select current_stock into v_s1 from public.wares where id = v_w1;
    insert into _results values ('restock: APPROVED restock increases stock exactly',
        v_s1 = 12 and v_restock.quantity = 2 and v_restock.ware_id = v_w1
        and v_restock.refund_item_id = v_ri1, v_s1::text);

    v_restock := public.admin_restock_refund_item(v_r1, v_ri1, v_w2, 1);
    select current_stock into v_s2 from public.wares where id = v_w2;
    insert into _results values ('restock: partial restock into a second allocated Ware',
        v_s2 = 11
        and (select sum(quantity) from public.refund_item_restocks where refund_item_id = v_ri1) = 3,
        v_s2::text);

    -- ---------------- cumulative limit (refund item) ----------------
    select count(*) into v_rows from public.refund_item_restocks;
    begin
        perform public.admin_restock_refund_item(v_r1, v_ri1, v_w1, 2);   -- 3 + 2 > 4
        insert into _results values ('restock: over refunded quantity rejected', false, 'restocked');
    exception when others then
        insert into _results values ('restock: over refunded quantity rejected',
            sqlerrm like '%exceeds refunded quantity%', sqlerrm);
    end;
    select current_stock into v_s1 from public.wares where id = v_w1;
    insert into _results values ('restock: over-limit call changed nothing',
        v_s1 = 12 and (select count(*) from public.refund_item_restocks) = v_rows, v_s1::text);

    -- exactly the remaining quantity is allowed
    perform public.admin_restock_refund_item(v_r1, v_ri1, v_w1, 1);       -- W1 total 3, item total 4
    select current_stock into v_s1 from public.wares where id = v_w1;
    insert into _results values ('restock: remaining quantity can be restocked to the limit',
        v_s1 = 13
        and (select sum(quantity) from public.refund_item_restocks where refund_item_id = v_ri1) = 4,
        v_s1::text);

    begin
        perform public.admin_restock_refund_item(v_r1, v_ri1, v_w1, 1);
        insert into _results values ('restock: fully restocked item rejects more', false, 'restocked');
    exception when others then
        insert into _results values ('restock: fully restocked item rejects more',
            sqlerrm like '%exceeds refunded quantity%', sqlerrm);
    end;

    -- ---------------- allocation limit (OrderItem, Ware) ----------------
    -- RI4 (1 unit of the same OrderItem) may not push W1 past its allocation of 3.
    begin
        perform public.admin_restock_refund_item(v_r4, v_ri4, v_w1, 1);
        insert into _results values ('restock: over the Ware allocation rejected', false, 'restocked');
    exception when others then
        insert into _results values ('restock: over the Ware allocation rejected',
            sqlerrm like '%exceeds the Ware allocation%', sqlerrm);
    end;

    -- W2 still has allocation left (2 allocated, 1 restocked)
    perform public.admin_restock_refund_item(v_r4, v_ri4, v_w2, 1);
    select current_stock into v_s2 from public.wares where id = v_w2;
    insert into _results values ('restock: allocation left in another Ware is usable',
        v_s2 = 12, v_s2::text);

    -- ---------------- Ware scope ----------------
    select count(*) into v_rows from public.refund_item_restocks;
    begin
        perform public.admin_restock_refund_item(v_r5, v_ri5, v_w4, 1);   -- unrelated Ware
        insert into _results values ('restock: unrelated Ware rejected', false, 'restocked');
    exception when others then
        insert into _results values ('restock: unrelated Ware rejected',
            sqlerrm like '%not an allocated Ware%', sqlerrm);
    end;

    begin
        perform public.admin_restock_refund_item(v_r4, v_ri4, v_w3, 1);   -- another OrderItem's Ware
        insert into _results values ('restock: another OrderItem''s Ware rejected', false, 'restocked');
    exception when others then
        insert into _results values ('restock: another OrderItem''s Ware rejected',
            sqlerrm like '%not an allocated Ware%', sqlerrm);
    end;

    -- ---------------- membership / input validation ----------------
    begin
        perform public.admin_restock_refund_item(v_r4, v_ri1, v_w1, 1);   -- item of another Refund
        insert into _results values ('restock: refund item of another Refund rejected', false, 'restocked');
    exception when others then
        insert into _results values ('restock: refund item of another Refund rejected',
            sqlstate = 'P0002' and sqlerrm like '%does not belong%', sqlerrm);
    end;

    begin
        perform public.admin_restock_refund_item(gen_random_uuid(), v_ri5, v_w3, 1);
        insert into _results values ('restock: unknown Refund rejected', false, 'restocked');
    exception when others then
        insert into _results values ('restock: unknown Refund rejected', sqlstate = 'P0002', sqlerrm);
    end;

    begin
        perform public.admin_restock_refund_item(v_r5, v_ri5, v_w3, 0);
        insert into _results values ('restock: zero quantity rejected', false, 'restocked');
    exception when others then
        insert into _results values ('restock: zero quantity rejected',
            sqlerrm like '%must be positive%', sqlerrm);
    end;

    begin
        perform public.admin_restock_refund_item(v_r5, v_ri5, v_w3, -1);
        insert into _results values ('restock: negative quantity rejected', false, 'restocked');
    exception when others then
        insert into _results values ('restock: negative quantity rejected',
            sqlerrm like '%must be positive%', sqlerrm);
    end;

    insert into _results values ('restock: rejected calls changed nothing',
        (select count(*) from public.refund_item_restocks) = v_rows, null);

    -- ---------------- repeated calls ----------------
    -- RI5: refunded 2, Ware W3 allocated 2. Five identical calls of 1.
    v_ok := 0;
    for v_i in 1..5 loop
        begin
            perform public.admin_restock_refund_item(v_r5, v_ri5, v_w3, 1);
            v_ok := v_ok + 1;
        exception when others then
            null;
        end;
    end loop;
    select current_stock into v_s3 from public.wares where id = v_w3;
    insert into _results values ('restock: repeated calls cannot exceed the refunded quantity',
        v_ok = 2 and v_s3 = 12
        and (select sum(quantity) from public.refund_item_restocks where refund_item_id = v_ri5) = 2,
        v_ok || ' succeeded, stock ' || v_s3);

    -- ---------------- exact stock accounting ----------------
    select current_stock into v_s1 from public.wares where id = v_w1;
    select current_stock into v_s2 from public.wares where id = v_w2;
    select current_stock into v_s4 from public.wares where id = v_w4;
    insert into _results values ('stock: every Ware equals initial + restock records',
        v_s1 = 10 + (select coalesce(sum(quantity), 0) from public.refund_item_restocks where ware_id = v_w1)
        and v_s2 = 10 + (select coalesce(sum(quantity), 0) from public.refund_item_restocks where ware_id = v_w2)
        and v_s3 = 10 + (select coalesce(sum(quantity), 0) from public.refund_item_restocks where ware_id = v_w3)
        and v_s4 = 5,
        v_s1 || '/' || v_s2 || '/' || v_s3 || '/' || v_s4);

    -- ---------------- existing helper untouched ----------------
    insert into _results values ('restock_order_item(): still present and service_role-only',
        exists (select 1 from pg_proc where oid = 'public.restock_order_item(uuid, uuid, bigint)'::regprocedure)
        and not has_function_privilege('anon', 'public.restock_order_item(uuid, uuid, bigint)', 'execute')
        and not has_function_privilege('authenticated', 'public.restock_order_item(uuid, uuid, bigint)', 'execute')
        and has_function_privilege('service_role', 'public.restock_order_item(uuid, uuid, bigint)', 'execute'),
        null);
end;
$$;

-- ------------------------------------------------------------
-- Catalog: internal-only table, service_role-only RPC
-- ------------------------------------------------------------

insert into _results values ('catalog: RLS enabled and no policy on refund_item_restocks',
    (select relrowsecurity from pg_class where oid = 'public.refund_item_restocks'::regclass)
    and (select count(*) from pg_policies
          where schemaname = 'public' and tablename = 'refund_item_restocks') = 0,
    null);

insert into _results values ('catalog: no anon/authenticated table privilege',
    not exists (
        select 1
          from unnest(array['anon', 'authenticated']) r,
               unnest(array['select', 'insert', 'update', 'delete', 'truncate']) p
         where has_table_privilege(r, 'public.refund_item_restocks', p)
    ),
    null);

insert into _results values ('catalog: admin_restock_refund_item is service_role-only',
    has_function_privilege('service_role', 'public.admin_restock_refund_item(uuid, uuid, uuid, bigint)', 'execute')
    and not has_function_privilege('anon', 'public.admin_restock_refund_item(uuid, uuid, uuid, bigint)', 'execute')
    and not has_function_privilege('authenticated', 'public.admin_restock_refund_item(uuid, uuid, uuid, bigint)', 'execute')
    and not has_function_privilege('public', 'public.admin_restock_refund_item(uuid, uuid, uuid, bigint)', 'execute'),
    null);

insert into _results values ('catalog: admin_transition_refund_status stays service_role-only',
    has_function_privilege('service_role', 'public.admin_transition_refund_status(uuid, text)', 'execute')
    and not has_function_privilege('anon', 'public.admin_transition_refund_status(uuid, text)', 'execute')
    and not has_function_privilege('authenticated', 'public.admin_transition_refund_status(uuid, text)', 'execute'),
    null);

insert into _results values ('consumer: refund_items columns carry no restock information',
    not exists (
        select 1 from information_schema.columns
         where table_schema = 'public'
           and table_name in ('refund_items', 'refund_requests')
           and (column_name ilike '%restock%' or column_name ilike '%ware%')
    ),
    null);

-- ------------------------------------------------------------
-- authenticated (the refund owner): no direct access
-- ------------------------------------------------------------
select
    set_config('request.jwt.claim.sub', (select id::text from _fx where key = 'client'), true),
    set_config('request.jwt.claims',
        json_build_object('sub', (select id::text from _fx where key = 'client'), 'role', 'authenticated')::text, true)
\g /dev/null
set local role authenticated;

do $$
declare
    v_count bigint;
    v_ri uuid;
begin
    -- the owner still reads its own refund items (unchanged Consumer contract)
    select count(*) into v_count from public.refund_items;
    insert into _results values ('consumer: owner still reads its refund items', v_count = 5, v_count::text);

    begin
        perform count(*) from public.refund_item_restocks;
        insert into _results values ('rls: authenticated cannot read restock records', false, 'selected');
    exception when others then
        insert into _results values ('rls: authenticated cannot read restock records', sqlstate = '42501', sqlerrm);
    end;

    begin
        insert into public.refund_item_restocks (refund_item_id, ware_id, quantity)
        select id, (select id from _fx where key = 'w1'), 1
          from public.refund_items limit 1;
        insert into _results values ('rls: authenticated cannot insert restock records', false, 'inserted');
    exception when others then
        insert into _results values ('rls: authenticated cannot insert restock records', sqlstate = '42501', sqlerrm);
    end;

    begin
        perform public.admin_restock_refund_item(
            (select id from _fx where key = 'r1'),
            (select id from _fx where key = 'ri1'),
            (select id from _fx where key = 'w1'), 1);
        insert into _results values ('rls: authenticated cannot call admin_restock_refund_item', false, 'executed');
    exception when others then
        insert into _results values ('rls: authenticated cannot call admin_restock_refund_item', sqlstate = '42501', sqlerrm);
    end;

    begin
        perform public.admin_transition_refund_status(
            (select id from _fx where key = 'r1'), 'REJECTED');
        insert into _results values ('rls: authenticated cannot call admin_transition_refund_status', false, 'executed');
    exception when others then
        insert into _results values ('rls: authenticated cannot call admin_transition_refund_status', sqlstate = '42501', sqlerrm);
    end;

    -- wares has no client policy: an UPDATE either errors or matches 0 rows.
    begin
        update public.wares set current_stock = current_stock + 100;
        get diagnostics v_count = row_count;
        insert into _results values ('rls: authenticated cannot change Ware stock',
            v_count = 0, v_count || ' rows updated');
    exception when others then
        insert into _results values ('rls: authenticated cannot change Ware stock', sqlstate = '42501', sqlerrm);
    end;
end;
$$;

reset role;

-- ------------------------------------------------------------
-- anon: nothing reachable
-- ------------------------------------------------------------
select
    set_config('request.jwt.claim.sub', '', true),
    set_config('request.jwt.claims', '{"role":"anon"}', true)
\g /dev/null
set local role anon;

do $$
begin
    begin
        perform count(*) from public.refund_item_restocks;
        insert into _results values ('rls: anon cannot read restock records', false, 'selected');
    exception when others then
        insert into _results values ('rls: anon cannot read restock records', sqlstate = '42501', sqlerrm);
    end;

    begin
        perform public.admin_restock_refund_item(
            gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), 1);
        insert into _results values ('rls: anon cannot call admin_restock_refund_item', false, 'executed');
    exception when others then
        insert into _results values ('rls: anon cannot call admin_restock_refund_item', sqlstate = '42501', sqlerrm);
    end;
end;
$$;

reset role;

select scenario, ok, detail from _results;

do $$
declare
    v_failures text[];
begin
    select array_agg(scenario) into v_failures from _results where not ok;

    if cardinality(v_failures) > 0 then
        raise exception 'refund restock check FAILED: %', v_failures;
    end if;

    raise notice 'refund restock check PASSED (% scenarios)', (select count(*) from _results);
end;
$$;

rollback;
