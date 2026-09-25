# Phase 8 Production E2E — Handoff

Checklist: `docs/mall1/v2/phase8-production-e2e.md` (source of truth for step details and PASS/FAIL records).
Phase 8 is **NOT COMPLETE**. `PHASES.md` stays `NOT STARTED` until the whole E2E passes.

## Baseline

- Branch: `main`
- Code baseline: `81cf37f` (Admin publish toggle, Warehouse creation, existing Variant↔Ware link). No code changes have been made during the production E2E; only docs.
- Migrations: local/remote synchronized (11), including `20260925150000_refund_item_restocks`.
- Production URLs: see the checklist (user-web / client-web / client-pwa / PG Test Monitor).

## Progress

| Steps | State |
|---|---|
| 1–10 | PASS |
| 11 Order creation | Order A created (see below). **Stock 10 → 8 not yet confirmed**; Order `PENDING` / Cart empty not yet confirmed |
| 12 Payment failure | Failure UI executed. **Order `PENDING` and PG Test Monitor failure record not yet confirmed** (see "Open finding") |
| 13–24 | Not started |

Steps 9 and 10 were reported PASS by the tester; some sub-items were not individually reported and are left unchecked in the checklist.
Step 7: "Ware/Warehouse not exposed" is left unchecked; it is verified systematically in step 23.

## Test data (production)

- Warehouse `Phase8 Test Warehouse` (`P8-WH`); Ware `Phase8 Test Ware` (`P8-WARE-1`). **Initial stock `S = 10`.**
- Product `Phase8 Test Product` (id `b37759ad-62e1-40ea-802d-95ea3a0a9c67`), 1 Variant `Black`, price 10,000, linked to the Ware (1 relation row).
- ProductPost `Phase8 Test Post`: `PUBLISHED`, linked to the Product.
- Consumer: a CLIENT Google account (different from the ADMIN account); shipping address(es) created in step 10.
- **Order A**: `ORD-20260925165934-EBA4C2DF` — Product `Phase8 Test Product`, Variant `Black`, quantity 2, total 20,000원. Expected status `PENDING`, expected Ware stock `8`.
- Expected stock sequence: Order A `S-2 = 8` → Order B (qty 1) `S-3 = 7` → Order B cancelled `8` → refund APPROVED `8` (unchanged) → Admin restock 1 `9`.

## Configuration issues found and fixed (no code change)

1. **Admin server access** — user-web showed `Admin server access is not configured.` → added `SUPABASE_SECRET_KEY` to the user-web Vercel **Production** env and redeployed. Admin server access works.
2. **Consumer OAuth landed on user-web** — the client-web callback URL was missing from Supabase Redirect URLs (fallback to Site URL). Added `https://shopping-mall-express-client-web.vercel.app/auth/callback`; Consumer OAuth works.

## Open finding (step 12, not yet diagnosed)

- The tester saw `결제 요청을 처리하지 못했습니다. 주문은 결제 대기 상태로 유지됩니다.`
- A recorded test failure shows `결제에 실패했습니다.` (payment `FAILED`). The observed first sentence is the generic **500** message from `apps/client-web/lib/payment/server.ts`, so the server call probably failed (most likely a missing client-web Production env: `SUPABASE_SECRET_KEY` / `PG_TEST_ENDPOINT_URL` / `PG_TEST_API_KEY`). A PG-side error would show `결제 처리 중 오류가 발생했습니다...` (502) instead.
- **client-web Production env has not been confirmed** (asked at step 6, never reported).
- client-pwa redirect URL `https://shopping-mall-express-client-pwa-teal.vercel.app/auth/callback` in Supabase is not yet confirmed (needed for step 24).

## Non-blocker issues (unfixed; collect after the E2E)

- Product create modal pre-fills "상품명" with the selected Ware's name (`emptyProductAddForm(ware.name)`). UX default, not a payload bug. Not fixed.
- No unlink UI for Variant↔Ware (`unlink_product_variant_ware` is SQL-only). Not fixed.
- Admin dashboard shows only low-stock (available ≤ 5) / out-of-stock Wares, never Warehouses or a full Ware list (by design).
- Tester's UI/design remarks: to be listed after the E2E.
- Known, unrelated to Phase 8: client-web `/auth/callback` redirects to an unvalidated `next` query value (open redirect candidate); stale `payment-contract.md` §14–15.

## Next start point

`Step 11 재고가 8인지 확인 → Step 12 Order PENDING + PG failure 기록 확인`

1. Step 11: user-web `/inventory` → `Phase8 Test Ware` stock should be **8**. SQL (read-only): `select order_number, status, payment_reference, total_amount from public.orders where order_number = 'ORD-20260925165934-EBA4C2DF';` → `PENDING`, no reference, 20000. Confirm the Cart is empty. Then record step 11 PASS.
2. Step 12 diagnosis:
   - Vercel client-web Production env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SECRET_KEY`, `PG_TEST_ENDPOINT_URL`, `PG_TEST_API_KEY` (add missing → Redeploy).
   - DevTools Network: which of `POST /api/payments` / `POST /api/payments/<id>/confirm` failed, with status and body.
   - SQL: `select id, purpose, status, amount, failure_reason, pg_callback_id, created_at from public.payments order by created_at desc limit 5;` (no row → failure at attempt creation).
   - PG Test Monitor: https://saas-showcase-admin-web.vercel.app/pg-test
   - Vercel client-web Logs for `POST /api/payments`.
3. Re-run the failure test on Order A (`/payment?orderId=...`): expect `결제에 실패했습니다.`, payment `FAILED`, Order `PENDING`, failure record in PG Test Monitor. Then continue with step 13 (success) on the same Order A.

## Rules for the continuation

- No new features, no new migration/RPC, no `db push` / `db reset --linked`, no automatic production data changes; the user operates the UI, the assistant judges PASS/FAIL and proposes minimal fixes only on FAIL.
- Update the checklist PASS/FAIL only from actual user-reported results; do not tick unreported sub-items.
