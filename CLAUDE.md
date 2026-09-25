# CLAUDE.md

## General

Modify only files required by the requested task.

Keep scope minimal and preserve existing user changes.

Do not fix or refactor unrelated issues. Report unrelated problems instead.

Prefer existing repository patterns and established contracts.

Do not scan the entire repository unless the task requires it.

Read `ARCHITECTURE.md` for repository structure, application responsibilities, and system boundaries.

Avoid generated and dependency directories unless specifically required:

* `node_modules/`
* `.next/`
* `dist/`
* `build/`
* `coverage/`
* `.turbo/`

Before making changes, inspect the relevant files and current `git status`.

## Mall v2 Source of Truth

Use the following priority when contracts or implementations disagree:

1. `docs/mall1/v2/product-schema.md`
2. `docs/mall1/v2/sql/*.sql`
3. `docs/mall1/v2/PHASES.md`
4. `packages/types`
5. current application contracts

Legacy API documentation, Inventory/SkuInventory structures, and deleted `apps/api` code must not override Mall v2.

Do not restore legacy behavior merely because old code or documentation still references it.

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

* Direct Supabase + RLS for safe or user-owned data
* Supabase RPC for transactional database operations
* Next Route Handlers for privileged credentials, server orchestration, or external integrations

Do not move transactional database logic into client code.

Do not expose privileged Supabase credentials to browser code.

## Domain Boundaries

Consumer domains include:

* Product/Post
* Option/Variant
* Cart
* Order
* History
* Refund
* Wishlist

Internal-only domains include:

* Ware
* Warehouse
* `product_variant_wares`
* `order_item_ware_allocations`

Never expose Ware/Warehouse internals through Consumer applications or Consumer-facing contracts.

`apps/user-web` is the Admin application.

Privileged operations must execute in a trusted server context.

## Shared Contracts

When a confirmed contract changes:

* update `packages/types`
* keep applications aligned with the confirmed SQL/RPC contract
* update relevant existing documentation when necessary

Do not modify unrelated applications.

Do not introduce duplicate domain models when an existing shared contract should be used.

## Supabase Development

This repository uses Supabase CLI with a local Docker-based Supabase environment.

The current production schema baseline is represented by the existing applied migration in `supabase/migrations/`.

Treat already-applied migrations as immutable.

Do not modify an applied baseline migration to implement a new database change.

For new database changes:

1. create a new migration
2. implement the required SQL/RLS/RPC/trigger changes
3. validate the full local migration chain with:

```bash
pnpm supabase db reset
```

4. perform relevant local database or application tests
5. report any failures or unresolved contract issues

Use the local Supabase environment for database development and validation.

Do not use the Supabase Dashboard SQL editor as the normal development workflow.

Do not directly modify the production database unless explicitly requested.

Never run the following without explicit user instruction:

```bash
pnpm supabase db push
pnpm supabase db reset --linked
```

Do not perform destructive or production-facing database operations merely because local validation succeeded.

A successful local database change does not automatically authorize production database deployment.

If a task requires a production migration, prepare and validate the migration locally, then report the migration that is ready to be applied.

## Local Supabase Safety

Local Supabase development may use:

```bash
pnpm supabase start
pnpm supabase stop
pnpm supabase status
pnpm supabase db reset
pnpm supabase migration new <name>
```

Use local credentials only in local development configuration.

Never copy production privileged credentials into browser-safe environment variables.

Do not commit local or production secrets.

Do not print secrets during validation or final reporting.

## Validation

Run validation related to changed code only.

Prefer targeted:

* typecheck
* lint
* tests
* package builds
* local Supabase database validation

Do not run full monorepo validation, E2E, browser automation, or Docker builds unless required by the task.

For database changes, `pnpm supabase db reset` should normally be part of validation.

For application changes, run the smallest relevant validation command for the affected package or application.

Never claim a validation passed unless the command actually ran successfully.

If an environment limitation prevents validation, report the limitation clearly instead of claiming success.

## Git and Deployment

Before modifying files, inspect:

```bash
git status
```

Preserve existing user changes.

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

Git push and Supabase database deployment are separate operations.

A successful Git push does not authorize:

```bash
pnpm supabase db push
```

Production database changes require explicit instruction.

## Versioning

Use Semantic Versioning.

* Production baseline: `v1.0.0`
* Mall v2 target: `v2.0.0`

Change versions or create release tags only when explicitly requested.

## Secrets

Never invent, expose, log, or commit secrets.

`NEXT_PUBLIC_*` variables must contain only browser-safe values.

Supabase privileged credentials are server-only.

Never create or expose a privileged Supabase client in browser code.

Do not print secret values during validation or final reporting.

## Dependencies

Use existing dependencies where possible.

Add, remove, or upgrade packages only when required by the requested task.

Do not perform dependency cleanup or modernization as unrelated work.

## Working Style

Before implementing a requested feature:

1. inspect the relevant existing implementation
2. identify the smallest affected scope
3. confirm applicable contracts and architecture boundaries
4. make the minimal necessary changes
5. validate the affected code locally
6. commit and push task-related changes if the task is complete
7. report unresolved issues instead of expanding scope without instruction

If SQL or database changes are required, include local Supabase validation in this process.

Do not silently broaden the requested task.

## Completion

Keep the final report concise.

Include:

* changed areas
* database migrations created or changed, if any
* validation performed
* unresolved related issues
* commit hash
* push/deployment result
* whether production database changes remain unapplied
