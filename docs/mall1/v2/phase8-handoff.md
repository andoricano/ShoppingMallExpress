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
| 11 Order creation | PASS. Order A created; stock `10 → 8`, Order `PENDING`, Cart empty confirmed. Tester later created 3 extra Orders under other IDs (stock now `5`); not part of the checklist — adjust expected stock of steps 17/21 accordingly |
| 12 Payment failure | PASS on Order `ORD-20260926072514-DFC92AA0` (10000): payment `fa3840a7-c485-431d-b693-3c9f1f77a99d` `FAILED`, Order `PENDING`, `payment_reference` null, PG Monitor same id `isSuccess: false`. (Attempt 1 on Order A failed: no `payments` row, missing `SUPABASE_SECRET_KEY`, fixed.) Order A itself was not used — `/payment?orderId=<Order A id>` showed `주문을 찾을 수 없습니다.` (owner RLS; likely different account/expired session, unconfirmed) |
| 13 Payment success | PASS with one open item, on `ORD-20260926072514-DFC92AA0` (tester's decision): payment `05aea877-6bdc-4463-894d-db0cd17989da` `SUCCEEDED`, Order `PAID`, `payment_reference` = that id, PG Monitor `isSuccess: true` amount 10000. **"Stock unchanged by payment" UNVERIFIED** (stock before payment not recorded) — re-verify in steps 17/21. `ORD-20260926063003-133CC21B` (Black × 4, 40,000원, reported paid) is reference evidence only |
| 14 Point top-up failure | PASS: payment `2e0fa7d9-...` `FAILED` (30000), no ledger row, no balance increase, PG Monitor `isSuccess: false` |
| 15 Point top-up success | PASS with one open item: payment `fd04e741-...` `SUCCEEDED` (30000), one `TOPUP` ledger row (`balance_after` 30000), PG Monitor `isSuccess: true`. UI refresh observation (balance stays 30000) not yet reported |
| 16 Order History | PASS: only the tester's own Orders shown, paid `ORD-20260926072514-DFC92AA0` included; snapshot sub-item not individually reported. (A "mixed client_id Orders" observation was a false alarm — the Admin shipping-history screen was opened by mistake.) |
| 17 PENDING Order cancel | PASS: stock decreased on Order B creation and was restored on cancel (tester report; actual numbers / Order B number / `CANCELLED` status not individually reported) |
| 18 Refund request | PASS with deviations: new test Order `ORD-20260926083620-FD4C6D7F` (Black × 4, 40,000원); full quantity `4` requested (not partial `1`); `REQUESTED` created. Refund amount and stock-at-request not individually reported |
| 19 Admin Refund APPROVED | PASS: `APPROVED`, Ware stock stayed `0` (approval alone does not restock — Policy B) |
| 20 Admin restock | PASS with one open item: restock of 4 took stock `0` → `4`. **"Restock beyond approved quantity is rejected" UNVERIFIED** (not tested); original-allocation-Ware selection not individually reported |
| 21 Stock verification | PASS as a sequence (`0` → `0` → `4`; changes only at restock, by exactly the approved quantity); the `S - 1` formula does not apply because of extra Orders |
| 22 Wishlist | PASS (toggle UI: add / list / remove confirmed; no separate "duplicate add" test — the UI is a toggle, DB unique constraint is reference only; re-add not individually reported) |
| 23–24 | Not started |

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

## Step 12 finding — root cause confirmed (client-web env), retest pending

Root cause: client-web Production was missing `SUPABASE_SECRET_KEY`; added + redeployed, payment success then worked on a new Order. Order A still needs the failure retest (see checklist step 12). Original analysis below is kept for the record.

- The tester saw `결제 요청을 처리하지 못했습니다. 주문은 결제 대기 상태로 유지됩니다.`
- A recorded test failure shows `결제에 실패했습니다.` (payment `FAILED`). The observed first sentence is the generic **500** message from `apps/client-web/lib/payment/server.ts`, so the server call probably failed (most likely a missing client-web Production env: `SUPABASE_SECRET_KEY` / `PG_TEST_ENDPOINT_URL` / `PG_TEST_API_KEY`). A PG-side error would show `결제 처리 중 오류가 발생했습니다...` (502) instead.
- **client-web Production env has not been confirmed** (asked at step 6, never reported).
- client-pwa redirect URL `https://shopping-mall-express-client-pwa-teal.vercel.app/auth/callback` in Supabase is not yet confirmed (needed for step 24).

## Non-blocker issues (unfixed; collect after the E2E)

- Product create modal pre-fills "상품명" with the selected Ware's name (`emptyProductAddForm(ware.name)`). UX default, not a payload bug. Not fixed.
- No unlink UI for Variant↔Ware (`unlink_product_variant_ware` is SQL-only). Not fixed.
- Admin dashboard shows only low-stock (available ≤ 5) / out-of-stock Wares, never Warehouses or a full Ware list (by design).
- Tester's UI/design remarks: to be listed after the E2E.
- **Architecture follow-up (non-blocker, raised at step 17; no code change now, review as a separate improvement after the whole E2E):** the current cancel / stock-restore structure is enough for the simple scenario, but needs a clearer design for compound cases: partial cancel; Orders with several Ware allocations; cancel after payment; partial refund combined with cancel; repeated cancel/restore of the same OrderItem; idempotency / concurrency and restore-history tracking.
- Known, unrelated to Phase 8: client-web `/auth/callback` redirects to an unvalidated `next` query value (open redirect candidate); stale `payment-contract.md` §14–15.

## Next start point

`Step 12 Order A 실패 결제 재테스트 (FAILED payment row + Order PENDING + PG Monitor failure record) → Step 13 Order A 성공 결제`

(Step 11 is PASS. The block below is the original plan; items already done: Step 11 checks, `SUPABASE_SECRET_KEY` fix.)

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
- Step 13 is judged on `ORD-20260926072514-DFC92AA0` (tester's decision, replacing the earlier "Order A only" plan because Order A could not be opened on `/payment`); `ORD-20260926063003-133CC21B` stays reference evidence that production payment works after the `SUPABASE_SECRET_KEY` fix. Order A stays `PENDING`/unpaid with its access problem unresolved.
- Extra Orders exist, so do not compare stock with the `S = 10` formulas. Record the actual Ware stock right before steps 12/13 as the baseline and compare only the before/after change (payment must not change stock). Recompute the later expected stock sequence (steps 17/21) from a fresh baseline taken at that time.
