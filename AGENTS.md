# AGENTS.md

## General

* Only modify code directly required by the requested task.
* Keep the scope as small as possible.
* Do not expand the task based on unrelated issues discovered during implementation.
* Report unrelated issues instead of fixing them.
* Do not re-analyze the entire repository unless explicitly requested.
* Inspect only files and code paths directly related to the current task.
* Preserve all pre-existing user changes.
* Prefer existing repository patterns over introducing new abstractions.

For repository structure and system boundaries, refer to `ARCHITECTURE.md` when available.

## Repository Exploration

Avoid repository-wide scans unless explicitly requested.

Do not generate the following by default:

* full dependency graphs
* full import graphs
* dead-code reports
* repository-wide architecture analysis

Do not inspect generated or dependency directories unless specifically required:

* `node_modules/`
* `.next/`
* `dist/`
* `build/`
* `coverage/`
* `.turbo/`

Prefer:

* targeted `rg` searches
* direct inspection of relevant files
* existing documentation
* package-level configuration files

Do not read framework documentation from `node_modules` unless necessary to resolve a specific problem.

## Scope Control

* Do not perform opportunistic refactoring.
* Do not fix unrelated bugs, warnings, security issues, lint issues, or type errors unless they directly block the requested task.
* Do not redesign surrounding code merely because a better design is possible.
* Prefer the smallest valid change.

If an unrelated issue is discovered:

1. Leave it unchanged.
2. Record it.
3. Report it at completion.

Do not remove apparently unused or legacy code without confirming its references first.

## API and Client Boundaries

For client application work, use the following as the primary source of truth for public API contracts:

1. `packages/types`
2. `docs/api/README.md`

During normal client work:

* Do not inspect or modify `apps/api`.
* Do not investigate controller, service, repository, or database implementation details.
* Do not infer undocumented API behavior from unrelated code.
* If the documented contract is missing, ambiguous, or inconsistent, report the gap instead of investigating API internals.

When API work is explicitly requested:

* Modifying `apps/api` is allowed.
* Inspect only the routes, controllers, services, repositories, and types directly related to the requested API change.
* Update `packages/types` when the public request or response contract changes.
* Update `docs/api/README.md` when public API behavior changes.
* Keep implementation, shared types, and API documentation consistent.
* Do not modify client applications unless explicitly included in the task.

Prefer keeping client-visible contracts independent from internal API implementation details.

## Validation

Run only small, targeted validation directly related to changed code.

Allowed by default:

* targeted unit tests for the changed module
* package-level typecheck for the affected package
* targeted lint for changed files or the affected package
* a small number of directly related API tests
* focused package build checks when useful to confirm the change

Do not run by default:

* full repository tests
* full monorepo typecheck
* full monorepo lint
* full monorepo build
* unrelated package tests
* end-to-end suites
* browser automation
* Docker builds
* long-running integration suites
* production deployment tests

Validation must remain within the scope of the current task.

If targeted validation fails because of an unrelated pre-existing issue:

1. Do not investigate it further unless it directly blocks the requested task.
2. Do not fix it automatically.
3. Report it.

Avoid repeatedly running the same validation command without a relevant code change.

Never claim that code builds, passes, works, or is tested unless the corresponding validation was actually executed successfully.

## Error Fixes

When the user provides an error log:

* Start from the exact reported error.
* Inspect only the directly related code first.
* Do not re-analyze the repository.
* Apply the smallest valid fix.
* Preserve behavior outside the failing path.
* Run only targeted validation relevant to the reported failure.

Do not turn a narrow error fix into a broader cleanup or refactor.

## Task Documentation

For meaningful feature work, refactoring, API contract changes, or architectural changes, create or update a concise document under:

`docs/changes/`

Do not create task documents for trivial edits or small error fixes unless documentation is specifically useful.

When appropriate, include:

* Goal
* Changed areas
* Implementation
* Static verification
* Executed validation
* Not verified
* Manual validation
* Known risks

Keep task documentation concise.

Manual validation should contain exact commands and practical verification steps.

Clearly distinguish between:

* statically reviewed
* actually executed and verified

Do not duplicate detailed API contract documentation from `docs/api/README.md`.

## Git Workflow

Before modifying files:

* inspect `git status`
* preserve pre-existing user changes

During commits:

* include only changes related to the current task
* do not include unrelated user changes
* commit after completing one logical task
* prefer one commit per logical task rather than one commit per file
* use concise commit messages describing the actual change

By default:

* do not push
* do not amend existing commits
* do not squash
* do not rebase
* do not rewrite Git history

Never use destructive Git commands such as:

* `git reset --hard`
* `git clean -fd`
* `git checkout -- .`
* `git restore .`

## CI/CD and Deployment

Frontend applications may be connected to Vercel through Git integration.

For Vercel-connected applications:

* Prefer Git-based deployment over direct `vercel deploy` commands.
* Do not manually deploy with `vercel --prod` unless explicitly requested.
* Do not change Vercel project settings unless explicitly requested.
* Do not modify deployment configuration unrelated to the current task.

When the user explicitly authorizes push/deployment for the current task:

1. Confirm the current branch.
2. Confirm `git status`.
3. Commit only task-related changes.
4. Push the current branch.
5. Allow the existing Git/Vercel integration to perform the deployment.

If a Vercel deployment fails:

* use the deployment/build error as the starting point
* inspect only directly related code or configuration
* do not re-analyze the full repository
* apply the smallest valid fix
* run targeted validation before another push when practical

A failed deployment is not permission to fix unrelated repository issues.

Backend deployment and Cloud Run configuration should only be modified when explicitly requested.

## Environment Variables and Secrets

* Never invent secrets or credentials.
* Never expose secrets in documentation, commits, logs, or source files.
* Do not copy secret values into tracked files.
* Use existing environment-variable names where possible.
* Public client variables such as `NEXT_PUBLIC_*` must never contain private credentials.
* If a required value is unavailable, report the required variable name instead of guessing its value.

## Dependencies

* Prefer existing dependencies.
* Do not add, remove, or upgrade packages unless required by the requested task.
* Do not perform dependency upgrades as unrelated cleanup.
* If a new dependency is necessary, explain why the existing stack cannot reasonably satisfy the requirement.

## Architecture

* Follow the existing architecture for ordinary implementation work.
* Do not redesign repository architecture unless explicitly requested.
* Use `ARCHITECTURE.md` as the high-level structure reference when available.
* Do not duplicate architecture analysis during normal tasks.

If the existing architecture directly blocks the requested task:

1. Identify the exact blocker.
2. Make the smallest necessary architectural change.
3. Explain the reason and impact.
4. Update `ARCHITECTURE.md` if the system boundary materially changed.

## Completion Report

Keep completion reports concise.

Include:

* what changed
* affected areas
* targeted validation that actually ran
* related issues intentionally left unchanged
* manual validation commands when needed
* created Git commit
* push/deployment result when push was explicitly authorized

Do not provide lengthy repository explanations unless explicitly requested.
