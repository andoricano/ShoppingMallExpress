# AGENTS.md

## General

* Modify only files required by the requested task.
* Keep scope minimal and preserve existing user changes.
* Do not fix or refactor unrelated issues; report them instead.
* Prefer existing repository patterns.
* Do not scan the entire repository unless required.
* Refer to `ARCHITECTURE.md` for repository structure and boundaries.

Avoid generated/dependency directories unless necessary:

* `node_modules/`
* `.next/`
* `dist/`
* `build/`
* `coverage/`
* `.turbo/`

## Mall v2 Source of Truth

Use this priority:

1. `docs/mall1/v2/product-schema.md`
2. `docs/mall1/v2/sql/*.sql`
3. `docs/mall1/v2/PHASES.md`
4. `packages/types`
5. current application contracts

Legacy API docs, Inventory/SkuInventory structures, and deleted `apps/api` code must not override Mall v2.

## Architecture

Mall v2 uses:

```text
Next.js
+ Supabase
+ RLS
+ Supabase RPC
+ Next Route Handlers when server-only execution is required
```

Do not restore the legacy Express architecture.

Use:

* Direct Supabase + RLS for safe/user-owned data
* Supabase RPC for transactional operations
* Next Route Handlers for privileged credentials, orchestration, or external integrations

Do not move transactional database logic into client code.

## Domain Boundaries

Consumer domains include Product/Post, Option/Variant, Cart, Order, History, Refund, and Wishlist.

Internal-only domains include:

* Ware
* Warehouse
* `product_variant_wares`
* `order_item_ware_allocations`

Never expose Ware/Warehouse internals to Consumer applications.

`apps/user-web` is the Admin application.

Privileged operations must run in a trusted server context.

## Shared Contracts

When contracts change:

* update `packages/types`
* keep applications aligned with the confirmed SQL/RPC contract
* update relevant existing documentation when needed

Do not modify unrelated applications.

## Validation

Run validation related to changed code only.

Prefer targeted typecheck, lint, tests, and package builds.

Do not run full monorepo validation, E2E, browser automation, or Docker builds unless required.

Never claim a check passed unless it actually ran successfully.

## Git and Deployment

Before modifying files, inspect `git status` and preserve existing changes.

For completed tasks:

* commit only task-related changes
* use a concise commit message
* push the commit to the current branch
* use the existing Git-based Vercel deployment flow

Do not amend, squash, rebase, rewrite history, or create tags unless explicitly requested.

Never use destructive repository-wide commands such as:

```text
git reset --hard
git clean -fd
git checkout -- .
git restore .
```

Do not manually trigger or modify production deployment settings unless required by the task.

## Versioning

Use Semantic Versioning.

* Production baseline: `v1.0.0`
* Mall v2 target: `v2.0.0`

Change versions or create release tags only when explicitly requested.

## Secrets

* Never invent, expose, or commit secrets.
* `NEXT_PUBLIC_*` must contain only browser-safe values.
* Supabase privileged credentials are server-only.
* Never create a privileged Supabase client in browser code.
* Do not print secrets during validation.

## Dependencies

Use existing dependencies where possible.

Add, remove, or upgrade packages only when required.

## Completion

Keep the final report concise:

* changed areas
* validation performed
* unresolved related issues
* commit hash
* push/deployment result
