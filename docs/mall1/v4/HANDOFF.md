# Mall V4 — Handoff

Written 2026-09-27 at the end of the planning session. Read this first in the next session; it exists so nothing has to be explained again. Order of reading: this file, `docs/mall1/v4/DECISIONS.md`, `docs/mall1/v4/PHASES.md`, then `AGENTS.md` / `CLAUDE.md` and, for Phase 1 work, `docs/mall1/v3/CUTOVER.md` (the record of what was verified in production and of the cutover order that will be re-issued at Phase 2).

State below is a snapshot; verify with `git status`, `git log`, and a read of Vercel before relying on it.

## 1. Repository

| Item | Value at writing |
|---|---|
| Current branch | `v3-preview` (the V4 work branch is **not created yet**) |
| HEAD | `23dc18e` (`docs: add mall v4 decisions and phase plan`) **plus the commit that adds this handoff and the O1-O6 resolutions** (run `git log -1`) |
| `origin/main` | `c69891f` |
| Local `main` | `5fbd1fd` (2 commits ahead of `origin/main`, **never pushed to `main`**) |
| `origin/v3-preview` | `f8a6ccb` |
| `v3-preview` vs `origin/main` | 7 commits ahead before the handoff commit, 0 behind (a strict fast-forward descendant; local `main` is an ancestor of it) |
| `v3-preview` vs `origin/v3-preview` | 4 commits ahead before the handoff commit, 0 behind |

Commits **not pushed to `origin/v3-preview`** (all documentation): `55589d4` preview state and PWA rollback, `9f1fd93` production env order / stop conditions / rollback targets, `abb1b76` read-only vs write smoke, `23dc18e` V4 decisions and phases, plus the handoff commit.
Commits on `v3-preview` but **not on `origin/main`**: `39ea298`, `5fbd1fd`, `f8a6ccb` (the Supabase Cron scheduler, which removes the old GitHub Actions workflow that `5fbd1fd` still adds) and the documentation commits above. `39ea298` and `5fbd1fd` reached `origin/v3-preview` as ancestors of `f8a6ccb`, not `main`.

**`main` must reach production only as one fast-forward of every commit between `origin/main` and the head of the work branch, never `5fbd1fd` alone**, and only at cutover step 6c after the Production flag scope is set (`docs/mall1/v3/CUTOVER.md` 4.1). The count of "5 commits" mentioned earlier in the session is outdated; use `git log origin/main..<branch>`.

Working tree was clean at writing. No file of the application code was changed in the planning session after `f8a6ccb`.

## 2. Production state (observed 2026-09-27; nothing applied)

**Supabase production** is the v2 baseline (last migration `20260925150000`). Not applied: any v3 migration, the legacy-Order resolution (3 unpaid PENDING Orders were approved as cutover targets and are **not** resolved), the stock conversion, the contraction, `pg_cron` / `pg_net` creation, the Vault entries, the cron jobs. Read-only observed: the precheck (BLOCKER 0, WARN 0), the scheduler prerequisites (`pg_cron` and `pg_net` available and not installed, Vault installed, `cron.database_name` is the production database), the platform has **no backup and PITR is off**, and a `pg_dump` of production restored into a local scratch database with equal counts and fingerprints.

**Vercel** (three projects `shopping-mall-express-client-web`, `-client-pwa`, `-user-web`, personal account `andoricano`, no team):
- Live production deployments: client-web `dpl_5Q77pdp2Uz5kddN8a9jdnRYBgzqG`, user-web `dpl_Geax8YwckyrWaU2gbYp9sjHv5gbU` (alias not re-read), client-pwa `dpl_5w35LXi6xoamjrYBXpFxSymzispr`. The PWA was **rolled back** to that deployment after an unintended production build with the v3 flag on (`dpl_EJnE6sjYm5dvFoy3wEc2sXGpjtkk`, not a rollback target). The PWA production bundle was re-verified as v2.
- Production env: **`NEXT_PUBLIC_MALL_V3` has no Production scope in any project and must stay that way** until cutover step 6a. `RECONCILE_JOB_SECRET` has Production and Preview scope (client-web). The v3 switches (`NEXT_PUBLIC_MALL_V3`, `PG_REVERSAL_ADAPTER`, client-pwa `NEXT_PUBLIC_CLIENT_WEB_URL`) exist in **Preview scope only**.
- Preview deployments of `f8a6ccb` (branch `v3-preview`), READY, **not promoted**: client-web `dpl_CcNxX6fCUg2EKnFQQYizMZn5adGC`, client-pwa `dpl_FDY1tBc5BRximZ6Cs9HbgLrXD1ED`, user-web `dpl_mACbFTcssbSeZbk3YGZWvuVAj5Cp`. Only the PWA's v3 flag was verified in its bundle; client-web and user-web Previews are behind Vercel SSO.
- Every push to `main` deploys to production automatically and reads the Production scope.
- client-pwa Production still holds `SUPABASE_SECRET_KEY`, `PG_TEST_*` that it does not read (cleanup candidate, not deleted).

**Not running anywhere**: no scheduler (GitHub Actions removed; the reconcile scheduler is Supabase Cron scripts in `supabase/cutover/`, not activated), no real PG (PG Test only), no notification channel.

**Local**: the local Supabase stack (Docker) is at the full migration chain including `20260927110000`; `supabase/verification/*` and `supabase/rehearsal/v3_cutover_rehearsal.sh` pass (rehearsal PASSED 2026-09-27). Docker Desktop had to be started by the session.

## 3. Why the v3 cutover is on hold (V4-D03)

The v3 domain works, but the product around it is not usable in production: no page-config persistence and a mock home page, no shell or way back in user-web, a dead purchase button and other placeholders, a PWA without the post body, a flat Ware / Variant admin with raw JSON metadata, and Posts that select Products instead of Variants. Cutting over v3 alone would put those in front of users and force a second migration window. The decision is to cut over **v3 and V4 Phase 1 together**, after the Phase 1.5 Data Protection Gate. `CUTOVER.md` stays as the record and is re-issued at Phase 2.

## 4. Where to start: V4 Phase 1

Phase 1 scope is `PHASES.md` Phase 1 (A to G). Units, each verified and committed on its own: (1) baseline and Playwright, (2) Admin shell, (3) cleanup, (4) page-config, (5) consumer recovery, (6) catalog authoring (Option matrix, Ware batch, metadata editor, inventory tree), (7) Post Variant selection, (8) E2E completion and gate.

**First action**: create the V4 work branch from the head of `v3-preview` (suggested name `v4`; confirm the name before creating it), then unit 1: run the existing v3 regression (SQL and HTTP suites, the rehearsal) as the baseline, introduce Playwright (V4-D12: a development dependency, so the lockfile changes), and walk the three apps in a browser to confirm the problem list below and to find any v2 feature lost with the v3 flag. Read-only production checks (the page-config table or data, the old `site_configs(key, value)` contract) are part of unit 4.

Findings already made (`code-level verification only`; confirm in the browser walk):

| Area | Finding |
|---|---|
| user-web shell | `app/(admin)/layout.tsx` has only a fixed auth box (`fixed right-4 top-4 w-72`); no page links back to `/`; each page builds its own header; `ProductAdminHeader` hard-codes "상품 판매글 추가"; `/users` has no header; dashboard cards "상품 게시물 관리" (`/products`) and "게시물 관리" (`/posts`, category assignment) are confusing |
| dev traces | dashboard text "저장 기능 미지원 (Mall v2 contract 미확정)"; `/master` is a Cloudinary form whose save is a no-op and whose ping endpoint does not exist; `console.log` in the design page, `PageDesignWorkspace`, client-web `Initializer` and stores; the `addMockProduct` button (`AdminProductSection.tsx`); the dead `useOrderClient` stub |
| page-config | no table in the 2026-09-24 production schema dump; the legacy Express used `site_configs(key='main_page', value)` (git `fd6a5e8`), removed in v2 (`8b2590a`); `useAdminPageConfig` works on `mainPageMock` with save disabled; client-web home and header and the PWA Hero render `mainPageMock` (slug menu links vs `/category/[id]` routes, unsplash images) |
| consumer | client-web "구매하기" is disabled and shows "주문 기능은 준비 중입니다." (`onPurchase` is never wired; buy-now is out, V4-D14); the PWA never renders the ProductPost `content` (client-web does, via `@mall/tiptap`); the PWA is one page with tab state |
| catalog | Option / OptionValue / Variant tables, `admin_create_product` and `admin_update_product` and the option / Variant editing UI already exist; missing are the cartesian generation, per-Variant stock and Ware batch creation; `EditInventoryModal` has a raw JSON textarea whose example puts size and color in Ware metadata; a Post selects Products (`product_post_products`), and `get_product_post_detail` exposes all active Variants of them; there is no tri-state selector anywhere |
| reuse | `AdminHeader` / `AdminMenu`, `ProductEditModal`, `link_product_variant_ware`, `LinkVariantWareModal`, `PageDesignWorkspace` and editors, `@mall/mall-page-viewer`, `@mall/tiptap` viewer, Storage bucket `images` and its upload-url route, the OrderItem snapshot columns |

Schema work in Phase 1 is additive only (`site_configs` JSONB and RPCs; `product_post_variants` with a backfill; optionally a batch RPC). `get_product_post_detail` and `list_product_posts` are called by the deployed v2 apps: keep their return shape.

## 5. Forbidden without a separate approval

- `git push` of any branch. Pushing `main` is additionally bound to `CUTOVER.md` 4.1 (Production flag scope first, whole fast-forward, never before the post-check).
- Any production deployment, redeploy, promotion, or rollback; any change of a **Production** scope variable; adding `NEXT_PUBLIC_MALL_V3` to the Production scope.
- Any production migration (`supabase db push` and every linked / remote Supabase CLI command included), the cutover scripts, the legacy Order resolution, the stock conversion or contraction, creating the Vault entries or the cron jobs (scheduler activation), `POST /api/internal/reconcile`.
- Production data writes of any kind; production reads only when asked and only read-only (`begin read only`, the connection string never printed).
- Real PG, real-money payment, external carrier API, deleting the PWA cleanup candidates.
- Starting an implementation before its analysis and plan; committing a change that failed or was not verified. A change that is implemented and verified is committed at once, without waiting.

## 6. Tooling notes

- Commit messages end with the attribution line given by the session reminder; nothing is amended, squashed, or rewritten.
- Local Supabase needs Docker (`open -a Docker`); validate migrations with `pnpm supabase db reset --local`; the rehearsal is `bash supabase/rehearsal/v3_cutover_rehearsal.sh`; the reconcile scheduler check is `bash supabase/verification/v3_phase9_reconcile.sh`.
- Vercel MCP is authorized (OAuth). Calls that pass `teamId` return 403; omit it. The bundle of a Preview behind SSO cannot be fetched with this token.
- zsh: quote globs (`--include='*.tsx'`) and do not start an `echo` argument with `=`.
- Production read-only SQL: `.env` `DATABASE_POOLER_URL`, a `postgres:17` container, `begin read only; ... commit;`, output redacted (see `supabase/cutover/v3_backup_and_verify.sh`).
