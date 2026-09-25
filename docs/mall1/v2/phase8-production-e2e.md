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
- [ ] `SUPABASE_SECRET_KEY`
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
- [ ] Order is `PENDING`. (not yet confirmed)
- [ ] Cart is empty. (not yet confirmed)
- [x] OrderItem snapshot exists. (product name / Variant / quantity / amount shown on `/payment`, which renders the OrderItem snapshot)
- [ ] Stock becomes `S - 2`. (expected 8; actual value not yet checked)

Order A number: `ORD-20260925165934-EBA4C2DF` (Product `Phase8 Test Product`, Variant `Black`, quantity 2, total 20,000원)
Observed stock: not yet checked (expected 8 = S - 2; S = 10)
Result: `IN PROGRESS` (order creation succeeded; stock and Order status checks pending)

## 12. Payment Failure

- [x] Select failure and submit. (executed)

Expected:
- [ ] Payment is `FAILED`. (not confirmed)
- [ ] Order remains `PENDING`. (not confirmed)
- [ ] Failure record appears at `https://saas-showcase-admin-web.vercel.app/pg-test`. (not confirmed)

Observed UI text: `결제 요청을 처리하지 못했습니다. 주문은 결제 대기 상태로 유지됩니다.`

Open finding: a properly recorded failure shows `결제에 실패했습니다.` (payment `FAILED`). The observed first sentence is the generic 500 message (`lib/payment/server.ts`), which suggests the server call failed rather than a recorded test failure (e.g. missing client-web Production `SUPABASE_SECRET_KEY` / `PG_TEST_*`). Not yet diagnosed; see `phase8-handoff.md`.

Result: `IN PROGRESS` (do not mark PASS until the `payments` row and the PG Test Monitor record are confirmed)

## 13. Payment Success

- [ ] Retry Order A payment.
- [ ] Select success and submit.

Expected:
- [ ] Payment is `SUCCEEDED`.
- [ ] Order becomes `PAID`.
- [ ] `payment_reference` contains payment id.
- [ ] Success record appears in PG Test Monitor.
- [ ] Stock does not change due to payment.

Result: `PASS / FAIL`

## 14. Point Top-up Failure
URL: `https://shopping-mall-express-client-web.vercel.app/mypage/point`

- [ ] Record current balance.
- [ ] Try allowed amount such as `5000`.
- [ ] Select failure.

Expected:
- [ ] Balance unchanged.
- [ ] No successful TOPUP ledger entry.

Result: `PASS / FAIL`

## 15. Point Top-up Success

- [ ] Top up same allowed amount with success.
- [ ] Refresh.

Expected:
- [ ] Balance increases exactly once.
- [ ] One `TOPUP` ledger entry exists.
- [ ] Refresh/retry does not duplicate credit.

Result: `PASS / FAIL`

## 16. Order History

URLs:
- `/mypage/history`
- `/mypage/order-history/<ORDER_ID>`

- [ ] Order A appears as paid.
- [ ] Snapshot values are shown.

Result: `PASS / FAIL`

## 17. PENDING Order Cancel

Create Order B with quantity `1` and do not pay.

Expected stock sequence:
- Order A created: `S - 2`
- Order B created: `S - 3`
- Order B cancelled: `S - 2`

- [ ] Cancel Order B.
- [ ] Order becomes `CANCELLED`.
- [ ] Stock returns to `S - 2`.

Result: `PASS / FAIL`

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
