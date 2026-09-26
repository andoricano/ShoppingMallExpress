# AGENTS.md

Repository rules for coding agents working in ShoppingEx / Mall.

Mall v3 business rules and implementation phases live in:

- `CLAUDE.md`
- `docs/mall1/v3/BUSINESS_LOGIC_AND_SCENARIOS.md`
- `docs/mall1/v3/PHASES.md`

Read `CLAUDE.md` before non-trivial v3 work.

The Safety Rules here and in `CLAUDE.md` state the same rules. If they ever differ, apply the stricter rule and report the difference.
Commit and push follow the Phase rule under "Git" below; outside it, commit or push only when the user asks.

## Authority

When sources disagree, use this order:

1. explicit user-approved decisions
2. `docs/mall1/v3/BUSINESS_LOGIC_AND_SCENARIOS.md`
3. approved v3 contracts
4. current schema / migrations / RPC / application code
5. `docs/mall1/v2/*`
6. legacy PRD

Current code and v2 documents are evidence of existing behavior, not automatically v3 policy.

If no approved rule exists, mark it `DECISION NEEDED`.
Do not invent business policy.

Keep v2 documentation as historical documentation.
New v3 policy belongs under `docs/mall1/v3/*`.

## Architecture

```text
Next.js
+ Supabase Auth / RLS / RPC
+ Next Route Handlers for server-only work
```

- Do not reintroduce the legacy Express API.
- Use direct Supabase + RLS for safe user-owned data.
- Use RPC for transactional database operations.
- Use Route Handlers for privileged credentials, orchestration, and external integrations.
- Do not move transactional logic into client code.
- `apps/user-web` is the Admin application.
- Consumer contracts must not expose Ware, Warehouse, numeric stock, reservation, allocation, or restock internals.
- See `ARCHITECTURE.md` for repository boundaries.

## Safety Rules

### Working tree

- Run `git status` before modifying files.
- Preserve user changes.
- Modify only task-related files.
- Do not fix unrelated problems.
- Avoid repository-wide scans unless required.
- Ignore generated/dependency directories such as `node_modules`, `.next`, `dist`, `build`, `coverage`, and `.turbo`.

### Git

Never run destructive history/worktree commands such as:

- `git reset --hard`
- `git clean -fd`
- `git checkout -- .`
- `git restore .`
- force-push, rebase, squash, amend, or history rewriting unless explicitly requested

Commit only task-related files.

A Phase may be committed and pushed when:

- its gate is PASS
- changes are additive or backward-compatible
- current production runtime remains functional
- production DB may still be on the previous schema without breaking the deployed apps
- no cutover or destructive change is activated
- required validation/regression checks passed

Do not push without user approval when the change:

- requires a production migration first
- activates cutover
- changes existing production schema/RPC semantics
- replaces an active production flow
- performs contraction/destructive cleanup

A Git push never authorizes a production DB operation.

### Database

- Never run `supabase db push` against production unless explicitly instructed.
- Never run `supabase db reset --linked`.
- Remote/linked Supabase operations require explicit approval.
- Production migrations require explicit approval.
- Local validation is not production approval.
- Applied migrations are immutable; use forward migrations.
- Validate the local migration chain with `pnpm supabase db reset`.
- Use local Docker Supabase for development and verification.

### Production

No mutating production data/schema operation without explicit approval.

This includes:

- row updates/deletes
- stock changes
- role changes
- payment/refund changes
- schema or migration application
- cutover

Read-only production inspection should also be scoped and reported.

### Secrets

- Never print, log, commit, or invent secrets.
- `NEXT_PUBLIC_*` is browser-safe only.
- Privileged Supabase credentials are server-only.
- Never create privileged Supabase clients in browser code.

### Deployment

Production deployment is allowed only when the pushed code is backward-compatible with the currently deployed production DB and does not activate an unapproved cutover.

Production DB migration and production deployment are separate approvals.

## Contracts and validation

- Keep `packages/types` aligned with confirmed SQL/RPC contracts.
- Do not create duplicate domain models.
- Run the narrowest useful verification first.
- Never report a check as PASS unless it actually ran.
- Distinguish production E2E from code/local verification.

Typical Phase flow:

```text
analyze
→ plan
→ implement
→ local DB reset
→ targeted verification
→ regression
→ typecheck/lint
→ diff review
→ commit
→ push if production-safe
```

## Documentation

Clearly distinguish:

- approved business policy
- current implementation
- observed E2E results
- implementation inference
- unresolved decisions

Do not convert unresolved policy into implementation assumptions.

## Versions

Use Semantic Versioning.

- Do not bump versions for every internal Phase.
- Bump minor versions for meaningful integrated product milestones.
- Mall v3 Phase 4 (`Stage 2 finalize`) completing its integration gate is the first planned `1.1.0` milestone.
- A version bump does not itself mean production cutover occurred.
- Tags/releases require explicit instruction.

## Completion report

Keep reports short:

- major changes
- validation results
- unresolved/blocking items
- Phase gate PASS/FAIL
- commit hash
- push status