# Phase 8 Production E2E Checklist

## Production URLs

| App | Production URL |
|---|---|
| user-web | https://shopping-mall-express-user-web-three.vercel.app |
| client-web | https://shopping-mall-express-client-web.vercel.app |
| client-pwa | https://shopping-mall-express-client-pwa-teal.vercel.app |
| PG Test Monitor | https://saas-showcase-admin-web.vercel.app/pg-test |
| PG Test API | https://saas-showcase-admin-web.vercel.app/api/pg-test |

## Preconditions

- [ ] All Supabase migrations are Local/Remote synchronized.
- [ ] Vercel production env is configured for each app.
- [x] Supabase Google provider is enabled.
- [ ] Supabase Redirect URLs include:
  - `https://shopping-mall-express-user-web-three.vercel.app/auth/callback`
  - `https://shopping-mall-express-client-web.vercel.app/auth/callback`
  - `https://shopping-mall-express-client-pwa-teal.vercel.app/auth/callback`
- [x] Google Cloud OAuth Authorized redirect URI includes:
  - `https://dfangxuyxudptlwgmzwp.supabase.co/auth/v1/callback`
- [x] Production Admin account has `user_profiles.role = 'ADMIN'`.

## Vercel Environment Checklist

### user-web
- [x] `NEXT_PUBLIC_SUPABASE_URL`
- [x] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [x] `SUPABASE_SECRET_KEY`

### client-web
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [x] `SUPABASE_SECRET_KEY` (was missing; added and redeployed during step 12/13 diagnosis)
- [ ] `PG_TEST_ENDPOINT_URL=https://saas-showcase-admin-web.vercel.app/api/pg-test`
- [ ] `PG_TEST_API_KEY`

### client-pwa
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`

`API_URL` is no longer required.

# E2E Flow

## 1. Admin Google Login
URL: `https://shopping-mall-express-user-web-three.vercel.app/admin-login`

- [x] Google login succeeds with ADMIN account.
- [x] Redirect returns to user-web.
- [x] Refresh preserves session.
- [x] `/inventory` opens successfully.

Note: the first attempt showed `Admin server access is not configured.` because `SUPABASE_SECRET_KEY` was missing from the user-web Production env. It was added and the app was redeployed; the error is gone. No code change.

Result: `PASS`

## 2. Warehouse / Ware
URL: `https://shopping-mall-express-user-web-three.vercel.app/inventory`

- [x] Create/select Warehouse.
- [x] Create Ware with initial stock.
- [x] Record initial stock as `S`.

Initial stock `S` = 10 (persisted after refresh).

Note (non-blocker): the Admin dashboard does not show the new Warehouse/Ware. By design it shows only low-stock (available <= 5) and out-of-stock active Wares plus counts, never Warehouses or a Ware list; a Ware with stock 10 does not appear until its available stock drops to 5 or below.

Result: `PASS`

## 3. Product + Option / Value / Variant
URL: `https://shopping-mall-express-user-web-three.vercel.app/products/add`

Suggested:
- Product: `Phase8 Test Product`
- Option: `Color`
- Value: `Black`
- Variant count: `1`
- Price: `10000`

- [x] Create Product.
- [x] Confirm Option/Value/Variant.
- [x] Confirm Ware connection.

Product created with 1 Variant (Product id `b37759ad-62e1-40ea-802d-95ea3a0a9c67`). Its stored name is `Phase8 Test Ware`, not the suggested `Phase8 Test Product`: the "상품명" field of the Product create modal is pre-filled with the selected Ware's name (`emptyProductAddForm(ware.name)`) and was submitted as-is. UX default, not a payload/mapping bug; non-blocker. The modal showed "선택한 Ware(Phase8 Test Ware)가 이 Variant에 연결됩니다." and the Product appeared in the Product list. The Variant ↔ Ware relation itself is verified in step 4.

Result: `PASS`

## 4. Variant ↔ Ware
URL: `https://shopping-mall-express-user-web-three.vercel.app/inventory`

- [x] Confirm correct Variant ↔ Ware relation.
- [x] Duplicate linking does not create duplicate relation rows.

Evidence (SQL): the Product exists, has exactly 1 Variant, and exactly 1 `product_variant_wares` relation row links it to `Phase8 Test Ware`.

Result: `PASS`

## 5. ProductPost Publish
user-web ProductPost create/edit UI.

- [x] Create ProductPost.
- [x] Add title/summary/thumbnail/body.
- [x] Link Product.
- [x] Publish using Admin UI.

Expected:
- [x] Status is `PUBLISHED`.
- [x] Product link remains intact.
- [x] Consumer can see the post. (verified in step 7)

Note: the Product was renamed to `Phase8 Test Product` through the existing Product edit modal before publishing; the rename succeeded. Publishing used the "게시하기" action; `/products` shows the post as 공개.

Result: `PASS`

## 6. Consumer Google Login
URL: `https://shopping-mall-express-client-web.vercel.app/auth`

- [x] Login with CLIENT Google account.
- [x] Session persists after refresh.

Note: the first attempt ended on user-web instead of client-web. Code was correct (`redirectTo` = `${window.location.origin}/auth/callback`, callback route present), so the cause was Supabase configuration (the client-web callback URL missing from the Redirect URLs allow-list, falling back to the Site URL). Passed after the Supabase configuration was fixed; no code change.

Result: `PASS`

## 7. ProductPost / Product Read
URLs:
- `https://shopping-mall-express-client-web.vercel.app/`
- `https://shopping-mall-express-client-web.vercel.app/products`

- [x] Published ProductPost appears.
- [x] Detail shows Product/Option/Variant.
- [ ] Ware/Warehouse fields are not exposed. (not inspected in this step; verified systematically in step 23)

Note: no functional blocker. The tester has UI/design remarks (non-blocker, not part of Phase 8 pass/fail); details to be collected after the E2E.

Result: `PASS`

## 8. Variant Selection

- [x] Select `Color = Black`.
- [x] Correct Variant is selected.
- [x] Variant price is displayed.
- [x] Raw stock quantity is not displayed.

Observed: price 10,000원, "구매 가능". Raw stock was not visible in the UI; the network responses are checked systematically in step 23.

Result: `PASS`

## 9. Cart

- [x] Add Variant.
- [ ] Add same Variant again and confirm quantity merge. (not individually reported)
- [ ] Update quantity. (not individually reported; the quantity must be set to 2 before step 11)
- [ ] Remove item. (not individually reported)

Observed: item added; quantity 5 reflected; product/Variant/quantity displayed correctly on the Cart screen. Tester judged the step PASS; the unchecked sub-items were not reported separately.

Result: `PASS`

## 10. Shipping Address

- [ ] Add address.
- [ ] Set default.
- [ ] Edit.
- [ ] Confirm `/order` loads saved address.
- [ ] Only one default address remains.

Note: the tester reported step 10 as PASS and proceeded to Order creation. The individual sub-items above were not reported one by one, so they are left unchecked.

Result: `PASS`

## 11. Order Creation

- [x] Add quantity `2` of test Variant.
- [x] Create Order A.

Expected:
- [x] Redirect to `/payment?orderId=...`.
- [x] Order is `PENDING`. (SQL: status `PENDING`, `payment_reference` null, total_amount 20000)
- [x] Cart is empty. (reported by tester)
- [x] OrderItem snapshot exists. (product name / Variant / quantity / amount shown on `/payment`, which renders the OrderItem snapshot)
- [x] Stock becomes `S - 2`. (tester reported Ware stock `8` right after Order A creation; S = 10)

Order A number: `ORD-20260925165934-EBA4C2DF` (Product `Phase8 Test Product`, Variant `Black`, quantity 2, total 20,000원)
Observed stock: `8` right after Order A creation (S - 2). The tester later created 3 more Orders under other Order IDs (stock now `5`); those extra Orders are not part of this checklist and must be accounted for in the expected stock of steps 17 and 21.
Result: `PASS`

## 12. Payment Failure

- [x] Select failure and submit. (executed)

Expected:
- [x] Payment is `FAILED`. (retest, see below)
- [x] Order remains `PENDING`. (retest, see below)
- [x] Failure record appears at `https://saas-showcase-admin-web.vercel.app/pg-test`. (retest, see below)

Observed UI text: `결제 요청을 처리하지 못했습니다. 주문은 결제 대기 상태로 유지됩니다.`

Open finding: a properly recorded failure shows `결제에 실패했습니다.` (payment `FAILED`). The observed first sentence is the generic 500 message (`lib/payment/server.ts`), which suggests the server call failed rather than a recorded test failure (e.g. missing client-web Production `SUPABASE_SECRET_KEY` / `PG_TEST_*`). Not yet diagnosed; see `phase8-handoff.md`.

Attempt 1 evidence (SQL join of Order A with `payments`): Order A `PENDING`, `payment_reference` null, and **no `payments` row exists for Order A** (payment_id / status / failure_reason / pg_callback_id all null). So the failure happened at payment attempt creation (`POST /api/payments`), before any PG call; the UI text was the generic 500, not a recorded `FAILED` payment. Order A stayed `PENDING` as expected. Root cause not yet confirmed; `POST /api/payments` needs only `NEXT_PUBLIC_SUPABASE_URL` + `SUPABASE_SECRET_KEY` (service-role client) and the `create_payment` RPC — `PG_TEST_*` are used later, at confirm.

Root cause (confirmed by tester): the client-web Production env was missing `SUPABASE_SECRET_KEY`, so the server-side Route Handler could not create the service-role client. After adding it and redeploying, a payment success flow worked on a new Order (see step 13). No code change.

Correction: the PG Test Monitor failure record `96cc1adb-fc01-4d0a-9f90-ddf327081a0e` (amount 40000, `isSuccess: false`) belongs to a separate 40,000원 Order, not Order A (20,000원). It is not evidence for step 12. Order A currently has no linked payment.

Retest (after the `SUPABASE_SECRET_KEY` fix), on a **different Order than Order A** — the tester's decision, see note below:
- Order: `ORD-20260926072514-DFC92AA0`; `order_status` `PENDING`; `payment_reference` null.
- `payments` row: id `fa3840a7-c485-431d-b693-3c9f1f77a99d`, `status` `FAILED`, amount 10000, `failure_reason` `PG test payment failed`, `pg_callback_id` `cb_Sdo3rhZLQ4seyk_U8kQ8adIpbH1arvW1`.
- PG Test Monitor: same id `fa3840a7-...`, same `callbackId`, `isSuccess: false`, amount 10000.
- UI showed the normal failure message.

Note: Order A (`ORD-20260925165934-EBA4C2DF`, id `803dcfc9-2677-4e21-8438-9afe8c84c075`) was never used for a failure/success payment. Opening `/payment?orderId=<Order A id>` returned `주문을 찾을 수 없습니다.` (owner RLS `orders_owner_select`: `client_id = auth.uid()`; most likely a different logged-in account or an expired session; cause not yet confirmed). The tester chose to judge steps 12/13 on the new Order above instead. Order A remains `PENDING` and unpaid; its access problem is unresolved.

Result: `PASS` (on Order `ORD-20260926072514-DFC92AA0`)

## 13. Payment Success

- [x] Retry payment on the subject Order (`ORD-20260926072514-DFC92AA0`, see below; not Order A).
- [x] Select success and submit.

Expected:
- [x] Payment is `SUCCEEDED`.
- [x] Order becomes `PAID`.
- [x] `payment_reference` contains payment id.
- [x] Success record appears in PG Test Monitor.
- [ ] Stock does not change due to payment. (UNVERIFIED: the Ware stock right before the payment was not recorded; re-verify in the stock verification steps 17/21)

Supporting evidence (not the step 13 result): after the `SUPABASE_SECRET_KEY` fix, the tester paid a **different, new Order** `ORD-20260926063003-133CC21B` (Product `Phase8 Test Product`, Variant `Black`, 10,000원 × 4, total 40,000원) and reported its status as paid (`결제 완료`). This shows the client-web payment success path works, but it is not Order A, and `payment_reference`, the `SUCCEEDED` payment row, the PG Test Monitor success record and the stock-unchanged check were not reported. The extra Order also consumed stock (relevant to steps 17 and 21). Sub-items above stay unchecked.

Step 13 subject (tester's decision): Order `ORD-20260926072514-DFC92AA0` (10000, `PENDING` after the step 12 failed payment), retried with success. `ORD-20260926063003-133CC21B` stays reference evidence only.

Reported so far (UI + SQL): UI shows `결제 완료`, total 10000; `order_status` `PAID`; `payment_reference` = `05aea877-6bdc-4463-894d-db0cd17989da` = latest `payment_id`; latest payment `SUCCEEDED`, amount 10000, `failure_reason` null; the earlier `FAILED` payment (`fa3840a7-...`) is preserved. So the Payment `SUCCEEDED`, Order `PAID` and `payment_reference` items are confirmed (Order-A-related sub-items above were written for Order A; read them against the subject Order). PG Test Monitor (reported): id `05aea877-6bdc-4463-894d-db0cd17989da`, `callbackId` `cb_nLZ6_58TYvhi1aryWplr1osTu--XCtQg`, `isSuccess: true`, amount 10000.

Not verified: the Ware stock right before this payment was not recorded, so "stock unchanged by payment" cannot be proven for this payment. It is left open and must be re-checked in the later stock verification steps (17/21), using a freshly recorded current stock before/after.

Result: `PASS` (all items met except the stock-unchanged item, which is UNVERIFIED — PASS with one open verification, on Order `ORD-20260926072514-DFC92AA0`)

## 14. Point Top-up Failure
URL: `https://shopping-mall-express-client-web.vercel.app/mypage/point`

- [x] Record current balance. (not reported directly; 0 by derivation — the user's only ledger entry is the step 15 top-up with `balance_after` 30000 = `amount` 30000)
- [x] Try allowed amount (30000 was used instead of `5000`; within the 1,000–1,000,000, 1,000-unit policy).
- [x] Select failure.

Expected:
- [x] Balance unchanged. (tester: no balance increase on failure)
- [x] No successful TOPUP ledger entry. (SQL: failure payment has no linked `point_ledger` row)

Evidence: payment `2e0fa7d9-a2d4-4d15-920f-467820314a51` `FAILED`, amount 30000, `ledger_id` null. PG Test Monitor: `callbackId` `cb_-WukWYxq6teeYk_P8Ps6RH3Q4NcxL1U4`, `isSuccess: false`, amount 30000.

Result: `PASS`

## 15. Point Top-up Success

- [x] Top up same allowed amount (30000) with success.
- [ ] Refresh. (tester will confirm the balance stays 30000 after a refresh; not yet reported)

Expected:
- [x] Balance increases exactly once. (tester: balance increased; the user's `point_ledger` has a single entry, `balance_after` 30000)
- [x] One `TOPUP` ledger entry exists. (SQL: `a2136c81-12ef-4795-a73c-322b975ce650`, `TOPUP`, amount 30000, `balance_after` 30000; no duplicate ledger rows for the user)
- [ ] Refresh/retry does not duplicate credit. (open: DB-level `point_ledger_payment_unique` prevents a second credit per payment; the UI refresh observation is still to be reported)

Evidence: payment `fd04e741-a8fd-41c5-8091-ceae9a784171` `SUCCEEDED`, amount 30000, linked to the single ledger row above. PG Test Monitor: `callbackId` `cb_JuHaKxMnV71gqZc8zPqKI9XtBV-f04Vc`, `isSuccess: true`, amount 30000.

Result: `PASS` (one open item: UI refresh observation not yet reported; re-verify in the final "Point idempotency verified" check)

## 16. Order History

URLs:
- `/mypage/history`
- `/mypage/order-history/<ORDER_ID>`

- [x] Paid Order appears as paid. (tester: `/mypage/history` shows the tester's own Orders, including the paid `ORD-20260926072514-DFC92AA0` and earlier Orders; step 13 subject, not Order A)
- [ ] Snapshot values are shown. (not individually reported)

Tester confirmed only the tester's own Orders are listed; no other CLIENT's Orders are exposed. An earlier suspicion of mixed `client_id` Orders was a false alarm: the tester had opened the Admin shipping-history screen by mistake. No security/RLS issue.

Result: `PASS` (snapshot sub-item not individually reported)

## 17. PENDING Order Cancel

Create Order B with quantity `1` and do not pay.

Expected stock sequence:
- Order A created: `S - 2`
- Order B created: `S - 3`
- Order B cancelled: `S - 2`

- [x] Cancel Order B.
- [ ] Order becomes `CANCELLED`. (not reported separately; a PENDING Order was cancelled and the stock was restored)
- [x] Stock returns to the value before Order B was created. (the `S - 2` formula is not used: extra Orders exist, so the actual before/after stock was compared)

Tester reported: stock decreased correctly when Order B was created, and was restored correctly when the PENDING Order B was cancelled. The three actual stock numbers and Order B's number were not reported.

Result: `PASS` (Order B number, the three stock numbers and the `CANCELLED` status were not individually reported)

## 18. Refund Request

Use paid Order A.

- [ ] Request refund for quantity `1`.

Expected:
- [ ] Refund request created.
- [ ] Amount uses OrderItem snapshot price.
- [ ] Stock remains `S - 2`.

Result: `PASS / FAIL`

## 19. Admin Refund APPROVED

- [ ] Approve refund in user-web.

Expected:
- [ ] Refund becomes `APPROVED`.
- [ ] Stock remains `S - 2`.

Result: `PASS / FAIL`

## 20. Admin Restock

- [ ] Select original allocation Ware.
- [ ] Restock quantity `1`.

Expected:
- [ ] Restock record is created.
- [ ] Stock becomes `S - 1`.
- [ ] Restock beyond approved quantity is rejected.

Result: `PASS / FAIL`

## 21. Stock Verification
URL: `https://shopping-mall-express-user-web-three.vercel.app/inventory`

Expected final stock: `S - 1`

Observed stock:
Result: `PASS / FAIL`

## 22. Wishlist

- [ ] Add ProductPost to Wishlist.
- [ ] Confirm it appears.
- [ ] Remove it.
- [ ] Duplicate add is safely handled.

Result: `PASS / FAIL`

## 23. Consumer Ware Non-Exposure

Search browser Network responses for:
- `ware`
- `warehouse`
- `current_stock`
- `reserved_stock`
- `allocation`
- `restock`

Expected:
- [ ] No Consumer response exposes internal Ware/Warehouse/restock details.
- [ ] Only Consumer-safe availability/status is exposed.

Result: `PASS / FAIL`

## 24. client-pwa Smoke Test
URL: `https://shopping-mall-express-client-pwa-teal.vercel.app/`

- [ ] Google login.
- [ ] ProductPost list.
- [ ] Product detail.
- [ ] Variant selection.
- [ ] Add/remove Cart item.
- [ ] Create Order.

Expected:
- [ ] Core Consumer flow works.
- [ ] PWA Order ends as `PENDING`.
- [ ] PWA has no Payment.
- [ ] Ware/Warehouse internals are not exposed.

Result: `PASS / FAIL`

# Final Phase 8 Result

- [ ] Steps 1–24 completed.
- [ ] No blocking production bug remains.
- [ ] Payment success/failure verified.
- [ ] Point idempotency verified.
- [ ] Cancel stock restoration verified.
- [ ] Refund approval does not restock.
- [ ] Admin restock restores only confirmed quantity.
- [ ] Consumer Ware/Warehouse boundary verified.
- [ ] client-pwa smoke test completed.

Final result: `PASS / FAIL`

Blocking issues:

1.
2.
3.

After all required checks pass, update `docs/mall1/v2/PHASES.md` and mark Phase 8 COMPLETE.
