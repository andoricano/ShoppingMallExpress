# Mall V4 — Decisions

Status: recorded 2026-09-27. This file is the record of the **explicit user-approved decisions** for V4. It is authority level 1 in the CLAUDE.md source-of-truth order, and it sits on top of the v3 rules in `docs/mall1/v3/BUSINESS_LOGIC_AND_SCENARIOS.md`. Where a decision here extends or overrides a v3 statement, the row says so; the v3 document is not rewritten (it stays the record of v3).

`docs/mall1/v4/PHASES.md` is derived from this file. A phase must not decide policy by accident: anything that is not decided here is listed in section 4 as `DECISION NEEDED`.

Nothing in this file has been implemented. It records decisions only.

---

## 1. Direction

| ID | Decision | Notes |
|---|---|---|
| V4-D01 | v3 built the backend and domain structure. **V4 completes a production-usable product**: UI/UX, CMS, Product / Variant / Ware operability, the consumer flow, and the operations around orders. | |
| V4-D02 | The regressions, placeholders, dev traces and inventory-UX problems found in the v3 review are **one V4 phase (Phase 1)**, all of it V4 MUST. | `PHASES.md` Phase 1 |
| V4-D03 | The **v3 production cutover is on hold until V4 Phase 1 and the Phase 1.5 Data Protection Gate are complete**. Nothing is applied to production before that. | Supersedes the earlier plan to cut over v3 alone; `docs/mall1/v3/CUTOVER.md` is re-issued at Phase 2 |
| V4-D04 | Order of work stays: analysis, plan, implementation, test. A unit of work that is implemented and verified is committed at once; a failed or unfinished change is not committed. **No push** and no production deploy / migration / cutover / scheduler activation without a separate approval. | Working rules |

## 2. Phase 1 product decisions

| ID | Decision |
|---|---|
| V4-D10 | Main page configuration is stored as **one JSONB document** (single `main_page` value, as the legacy `site_configs` design), read publicly through a narrow RPC and written only by an Admin. |
| V4-D11 | A ProductPost selects **explicit Variants**, not whole Products (`product_post_variants`). Existing Posts are backfilled with the Variants they expose today. **A Variant added later is not exposed automatically.** The database stores only the leaf Variant ids. |
| V4-D12 | **Playwright** is introduced for browser E2E (a development dependency; this changes the lockfile, which is otherwise not touched). |
| V4-D13 | The **`/master` (Cloudinary) screen is removed**, with the dashboard "settings" entry and every form whose values are not actually saved. |
| V4-D14 | **Buy-now is not implemented in V4.** The disabled "구매하기" button and its "주문 기능은 준비 중입니다." text are removed. The cart is the way to order (DN-23 stays: no selected-item orders). |
| V4-D15 | The Admin shell is a **sidebar plus a mobile drawer**, with header, breadcrumb, and a way back to the Admin root from every page. |
| V4-D16 | The Option / OptionValue / Variant model **stays and is reused**. Category and Option are not mixed; Color and Size are Options, never Ware metadata. A Ware is linked to the final leaf Variant; **Wares do not form a parent-child tree**. |

## 3. Payment, fulfillment, data protection, communication

| ID | Decision | Effect |
|---|---|---|
| V4-D20 | **V4 keeps the current PG Test structure.** Real PG vendor integration and real-money payment are **out of V4**. The real PG reversal adapter and the webhook productionization are **not** V4 completion conditions. A move to real payment is planned later as its own phase. | Phase 3 is reclassified (PHASES.md). Extends v3 section 14 (`authorize/capture` and Point stay excluded). |
| V4-D21 | **No external carrier API** and no live delivery tracking in V4; they move to a later version. | Phase 4 |
| V4-D22 | A `PENDING` Order **never expires automatically**. It stays until the seller confirms or processes it. The consumer can cancel it while it is `PENDING` (`PENDING -> CANCELLED`). After `PROCESSING` the ordinary Cancel stays refused, as in v3. | Resolves the open v3 decision "PENDING expiration policy". Consistent with v3 sections 5, 9, 11. |
| V4-D23 | **Delivery completion.** The Admin moves an Order `PROCESSING -> SHIPPED`; the moment of that transition is recorded as the delivery start. The consumer confirms receipt: `SHIPPED -> DELIVERED` at once. If the consumer does not confirm, an Order becomes `DELIVERED` automatically **14 days after the `SHIPPED` transition** (not after the Order creation date). The automatic completion is designed to be **idempotent**: a repeated or concurrent run changes nothing more. | Completes the "remaining Order status transition details" left open in v3 section 7 |
| V4-D24 | Fulfillment without a carrier is limited to: Admin `PROCESSING -> SHIPPED`, consumer receipt confirmation, and the 14-day automatic completion. | See open items O2 and O3 |
| V4-D25 | **No paid Supabase backup / PITR plan is required for V4.** The current production safety gate stays: a fresh `pg_dump` right before an important migration or cutover, a restore into a local scratch database, a row-count and fingerprint comparison, and **stop when the restore check fails**. Supabase backup / PITR is re-reviewed **before any paid service or real-money PG** is introduced. | Phase 1.5 is designed to pass on this basis; the platform still has no backup and PITR is off (`CUTOVER.md` 1) |
| V4-D26 | **Customer communication is not implemented in V4**: no notification channel (mail, SMS, push), no reviews, no inquiries. They move to V5. | Former Phase 7 moves to the V5 candidates |

## 4. Open items (`DECISION NEEDED`, not decided)

Do not implement these by choice. Each is answered before the phase that needs it starts.

| ID | Open item | Needed by | Note |
|---|---|---|---|
| O1 | `shipped_at` for Orders that are already `SHIPPED` when the timestamp column appears: what value do they get, and do they take part in the 14-day rule? | Phase 4 | The 14 days count from the `SHIPPED` transition, which is not recorded today (`orders` has no such column) |
| O2 | The current v3 Admin can also move `SHIPPED -> DELIVERED` by hand (`admin_advance_order`). V4-D23 / D24 list only the consumer confirmation and the automatic completion. Is the Admin manual `DELIVERED` kept or removed? | Phase 4 | `CONFLICT` with the current implementation until answered |
| O3 | Are a carrier name and a tracking number entered **by hand** by the Admin (no API)? | Phase 4 | V4-D21 excludes the API, not necessarily the fields |
| O4 | Seller rejection reason / state model | Phase 4 | Open since v3 |
| O5 | Error-tracking / monitoring service (a third party, or the platform logs only) | Phase 5 | |
| O6 | The date and conditions for re-reviewing Supabase backup / PITR (V4-D25) | before a paid service or real-money PG | |

## 5. Not in V4

Real PG vendor and real-money payment, the real reversal adapter and webhook productionization, external carrier API and live tracking, notification channels, reviews and inquiries, buy-now, discounts / coupons / shipping fees, and multi-warehouse allocation priority with a stock history. They are recorded as V5 candidates in `PHASES.md` section 5.
