# AGENTS.md

## General

* Modify only files directly required by the requested task.
* Keep scope as small as possible.
* Preserve all existing user changes.
* Do not fix unrelated issues; report them instead.
* Do not perform opportunistic refactoring.
* Do not re-analyze the entire repository unless explicitly requested.
* Prefer existing repository patterns over new abstractions.
* Refer to `ARCHITECTURE.md` for repository structure and system boundaries.

## Repository Exploration

Prefer targeted inspection:

* `rg`
* directly related files
* package-level configuration
* existing documentation

Avoid repository-wide scans unless explicitly requested.

Do not inspect generated/dependency directories unless necessary:

* `node_modules/`
* `.next/`
* `dist/`
* `build/`
* `coverage/`
* `.turbo/`

## Mall v2 Source of Truth

For Mall v2 work, use this priority:

1. `docs/mall1/v2/product-schema.md`
2. `docs/mall1/v2/sql/*.sql`
3. `docs/mall1/v2/PHASES.md`
4. `packages/types`
5. current application contracts

Legacy `docs/api/README.md`, Inventory/SkuInventory structures, and deleted `apps/api` code must not override the confirmed Mall v2 contract.

## Mall v2 Architecture

Mall v2 uses:

```text
Next.js
+ Supabase
+ RLS
+ Supabase RPC
+ Next Route Handlers when a server-only boundary is required
```

Do not restore `apps/api` or the legacy Express architecture unless explicitly requested.

Choose the smallest appropriate data boundary:

* Direct Supabase + RLS for safe reads/user-owned data
* Supabase RPC for transactional or consistency-sensitive operations
* Next Route Handler for server-only credentials, orchestration, or external integrations

Do not reproduce transactional database logic in client code.

## Domain Boundaries

Consumer commerce operates on:

* ProductPost
* Product
* ProductOption
* ProductOptionValue
* ProductVariant
* Cart
* Order / OrderItem
* History
* Refund
* Wishlist

Internal-only domains include:

* Ware
* Warehouse
* `product_variant_wares`
* `order_item_ware_allocations`

Never expose Ware/Warehouse internals to Consumer applications.

`apps/user-web` is the current Admin application.

Privileged Admin operations must run in a trusted server context.

## Shared Contracts

When a shared contract changes:

* update `packages/types`
* keep application contracts consistent with the confirmed SQL/RPC contract
* update relevant documentation when necessary

Do not modify unrelated applications unless included in the task.

## Validation

Run only validation directly related to changed code.

Prefer:

* affected package typecheck
* targeted lint
* targeted tests
* focused package build

Do not run by default:

* full monorepo build/typecheck/lint
* unrelated tests
* E2E suites
* browser automation
* Docker builds
* deployment tests

If validation fails because of an unrelated existing issue, report it instead of expanding scope.

Never claim a check passed unless it was actually executed successfully.

## Errors

When given an error log:

1. Start from the exact reported error.
2. Inspect the directly related path.
3. Apply the smallest valid fix.
4. Run targeted validation.
5. Leave unrelated problems unchanged.

## Documentation

Do not create a new `docs/changes/` document for every task.

Create or update task documentation only when:

* explicitly requested, or
* the change cannot be adequately represented by existing domain, phase, architecture, or API documentation.

Keep documentation concise.

## Git

Before modifying files:

* inspect `git status`
* preserve pre-existing user changes

For commits:

* include only task-related changes
* prefer one commit per logical task
* use concise commit messages

Do not by default:

* push
* amend
* squash
* rebase
* rewrite history

Never use destructive commands such as:

* `git reset --hard`
* `git clean -fd`
* `git checkout -- .`
* `git restore .`

Push only when explicitly authorized.

## Versioning

Use Semantic Versioning.

Current production baseline:

```text
v1.0.0
```

Mall v2 is a breaking architectural/domain transition and targets:

```text
v2.0.0
```

Use prerelease versions for meaningful Mall v2 checkpoints when version updates are requested:

```text
2.0.0-alpha.N
2.0.0-beta.N
2.0.0-rc.N
2.0.0
```

Do not create release tags unless explicitly requested.

## Environment and Secrets

* Never invent or expose secrets.
* Never commit secrets.
* `NEXT_PUBLIC_*` must contain only browser-safe values.
* Supabase secret/service-role credentials are server-only.
* Never instantiate a privileged Supabase client in browser code.
* Do not print secret environment values during verification.

## Dependencies

* Prefer existing dependencies.
* Add/remove/upgrade packages only when required by the task.
* Do not perform unrelated dependency upgrades.

## Deployment

Prefer existing Git-based deployment flows.

Do not:

* run production deployments unless explicitly requested
* change Vercel/project settings without explicit instruction
* treat a deployment failure as permission for unrelated refactoring

## Completion Report

Keep completion reports concise.

Report:

* changed files/areas
* validation actually executed
* intentionally unresolved related issues
* commit hash if created
* push/deployment result if explicitly requested
