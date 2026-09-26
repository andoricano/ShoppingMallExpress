# AGENTS.md

Repository rules for every coding agent working in ShoppingEx / Mall.

Mall v3 is in the business-rule definition stage. It is not an implementation phase.
The v3 business-policy workflow and the approved v3 rules live in `CLAUDE.md` and `docs/mall1/v3/*`.
Read `CLAUDE.md` before any non-trivial v3 work.

The "Safety Rules" section below is mirrored verbatim in `CLAUDE.md`.
If the two files ever differ, apply the stricter rule and report the difference.

## Authority (v3)

Use this order when sources disagree:

1. explicit user-approved business decisions
2. `docs/mall1/v3/BUSINESS_LOGIC_AND_SCENARIOS.md` (once it exists)
3. approved v3 domain contracts
4. current schema / migrations / RPC / application code (evidence of existing behavior only)
5. `docs/mall1/v2/*` (v2 history)
6. legacy PRD (historical intent only)

Rules:

- Current code, existing v2 SQL, v2 docs, the legacy PRD, and old E2E successes are not approved v3 policy.
- If no approved rule exists, the item is `DECISION NEEDED`.
  Do not invent a rule and do not turn `DECISION NEEDED` into an implementation choice.
- When sources disagree, report the disagreement (`CONFIRMED` / `CONFLICT` / `DECISION NEEDED`).
- `docs/mall1/v2/*` is preserved as historical documentation.
  Do not rewrite it to make it look like v3 rules were always intended.
  v3 rules belong under `docs/mall1/v3/*`.

## Architecture

```text
Next.js
+ Supabase Auth / RLS / RPC
+ Next Route Handlers when server-only execution is required
```

- Do not reintroduce the legacy Express/API architecture.
- Prefer direct Supabase + RLS for safe, user-owned data. Use RPC for transactional operations.
  Use Route Handlers for privileged credentials, orchestration, or external integrations.
- Do not move transactional database logic into client code.
- `apps/user-web` is the Admin application. Privileged operations run in a trusted server context.
- Ware, Warehouse, stock, allocation, and restock internals never reach Consumer applications
  or Consumer-facing contracts.
- Refer to `ARCHITECTURE.md` for repository structure and boundaries.

<!-- BEGIN SAFETY RULES (mirrored verbatim in AGENTS.md and CLAUDE.md) -->
## Safety Rules (non-negotiable)

### Working tree and scope

- Before modifying any file, run `git status` and read the files you will change.
- Preserve existing user changes. Never overwrite, revert, or reformat changes you did not make.
- Modify only files required by the requested task.
- Do not fix unrelated files or problems; report them instead.
- Do not scan the whole repository unless the task requires it.
  Avoid generated and dependency directories
  (`node_modules/`, `.next/`, `dist/`, `build/`, `coverage/`, `.turbo/`).

### Git

- Never run `git reset --hard`, `git clean -fd`, `git checkout -- .`, `git restore .`,
  or any equivalent command that discards work.
- Do not amend, squash, rebase, force-push, rewrite history, or create/move tags unless explicitly requested.
- Commit or push only when the user asks, or when the task explicitly includes it.
  Commit only task-related files.
- A Git push does NOT authorize any database or Supabase operation.

### Database and migrations

- Never run `supabase db push` (including `pnpm supabase db push`) unless the user explicitly
  instructs it in the current task.
- Never run `supabase db reset --linked`, or any reset against a remote or linked database.
- Any Supabase CLI command that targets the linked/remote project
  (`--linked`, a remote `--db-url`, `link`, `migration repair`, `db pull`, `functions deploy`, ...)
  requires an explicit instruction. If such a command is read-only, say so before running it.
- Applying a migration to production requires an explicit instruction that names the migration(s).
  Preparing and validating a migration locally is not an instruction to apply it.
- A successful local result (`pnpm supabase db reset`, local tests) is NOT approval to apply anything to production.
- Treat applied migrations as immutable. Make changes as a new forward migration,
  validate the full local chain with `pnpm supabase db reset`, then report the migration as ready.
- Use the local Docker Supabase (`pnpm supabase start|stop|status`, `db reset`, `migration new`)
  with local credentials only. Do not use the Dashboard SQL editor as the development workflow.

### Production

- No destructive or mutating production operation (data or schema) without explicit authorization.
  This includes deleting or updating rows, changing publication state, stock, user roles,
  or payment/refund records.
- Read-only production inspection only when requested. State what it reads.
- For destructive SQL: explain what it changes, scope it narrowly, and wait for approval.

### Secrets

- Never invent, print, log, quote in reports, or commit secrets, keys, or tokens.
- `NEXT_PUBLIC_*` variables hold browser-safe values only.
  Privileged Supabase credentials are server-only.
  Never create a privileged Supabase client in browser code.
  Never copy production privileged credentials into local or browser-safe configuration.

### Deployment

- Do not trigger or modify production deployment settings unless the task requires it.
<!-- END SAFETY RULES -->

## Contracts and validation

- When an approved contract changes, update `packages/types` and keep applications aligned
  with the confirmed SQL/RPC contract. Do not add duplicate domain models.
  Do not modify unrelated applications.
- Run the narrowest useful verification first (targeted typecheck, lint, tests, SQL/RPC checks).
  Do not run full-monorepo validation, browser automation, or Docker builds unless required.
- Never claim a check passed unless it actually ran successfully.
  Distinguish `production E2E observed` from `code-level verification only`.

## Documentation

Documentation must distinguish approved business policy, current implementation,
observed E2E results, code-only inference, and unresolved policy.
Do not mark a checkbox PASS from indirect evidence unless the document explicitly allows it.

## Versions and dependencies

- Use Semantic Versioning. Change versions or create release tags only when explicitly requested.
- Use existing dependencies. Add, remove, or upgrade packages only when the task requires it.

## Completion report

Keep it concise:

- changed files and purpose
- validation actually run (exact commands and results)
- unresolved or unverified items
- commit hash and push status (only if a commit or push was requested)
