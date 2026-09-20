# AGENTS.md

## General

* Only modify code that is directly required by the requested task.
* Do not expand the scope based on unrelated issues discovered during the task.
* Report unrelated issues instead of fixing them.
* Do not re-analyze the entire repository unless explicitly requested.
* Inspect only files and code paths directly related to the current task.
* Preserve all existing user changes.

## Repository Exploration

* Avoid repository-wide scans unless explicitly requested.
* Do not generate full dependency graphs, import graphs, dead-code reports, or architecture reports by default.
* Do not inspect generated or dependency directories unless specifically required:

  * `node_modules/`
  * `.next/`
  * `dist/`
  * `build/`
  * `coverage/`
  * `.turbo/`
* Prefer targeted `rg` searches and direct file inspection.
* Do not read framework documentation from `node_modules` unless necessary.

## Scope Control

* Do not perform opportunistic refactoring.
* Do not fix unrelated bugs, warnings, security issues, lint issues, or type errors unless they directly block the requested task.
* If an unrelated issue is discovered:

  1. Leave it unchanged.
  2. Record it.
  3. Report it at the end.
* Do not remove apparently unused or legacy code without confirming its references.
* Prefer the smallest change that satisfies the requested task.

## API and Client Boundaries

For client application work, use the following as the source of truth for API contracts:

* `packages/types`
* `docs/api`

During client work:

* Do not inspect or modify `apps/api`.
* Do not investigate API internals unless explicitly requested.
* If the documented API contract is missing, ambiguous, or insufficient, report the gap instead of analyzing the API implementation.

During explicitly requested API work:

* Modifying `apps/api` is allowed.
* Update `packages/types` when the public contract changes.
* Update `docs/api` when the public contract changes.
* Do not modify client applications unless explicitly requested.



## Validation

Run only small, targeted validation directly related to the changed code.

Allowed by default:

* targeted unit tests for the changed module
* targeted typecheck for the affected package
* targeted lint for the affected files or package
* a small number of directly related API tests
* focused build checks only when necessary to confirm the change

Do not run by default:

* full repository tests
* full monorepo typecheck
* full monorepo lint
* unrelated package tests
* end-to-end test suites
* browser automation
* Docker builds
* long-running integration test suites
* production deployment tests

Validation must stay within the scope of the current task.

If a targeted validation fails because of an unrelated existing issue, do not investigate or fix that issue unless it directly blocks the requested task. Report it instead.

Keep command output concise and avoid repeatedly running the same validation without a code change.

Never claim that something was verified unless the corresponding validation was actually executed.



## Error Fixes

When the user provides an error log:

* Start from the exact reported error.
* Inspect only the directly related code first.
* Do not re-analyze the entire repository.
* Apply the smallest valid fix.
* Preserve existing behavior outside the failing path.

## Task Documentation

For meaningful feature work, refactoring, or architectural changes, create or update a concise document under:

`docs/changes/`

Do not create task documents for trivial edits.

When useful, include:

* Goal
* Changed areas
* Implementation
* Static verification
* Not verified
* Manual validation
* Known risks

Keep task documents concise.

Manual validation should contain exact commands and practical verification steps for the user.

Clearly distinguish between:

* statically reviewed
* actually executed and verified

## Git Workflow

* Inspect `git status` before modifying files.
* Preserve pre-existing user changes.
* Do not include unrelated user changes in commits.
* Commit after completing one logical task.
* Prefer one commit per logical task, not one commit per file.
* Use concise commit messages describing the actual change.
* Do not push.
* Do not amend, squash, rebase, or rewrite existing commits unless explicitly requested.

Never use destructive Git commands such as:

* `git reset --hard`
* `git clean -fd`
* `git checkout -- .`
* `git restore .`

## Dependencies and Architecture

* Prefer existing dependencies and existing repository patterns.
* Do not add, remove, or upgrade dependencies unless required by the requested task.
* Do not redesign repository architecture during ordinary implementation work.
* If the existing architecture directly blocks the requested task:

  1. Identify the exact blocker.
  2. Make the smallest necessary change.
  3. Report the reason and impact.

## Completion Report

Keep the final report concise.

Include:

* what changed
* affected areas
* related issues intentionally left unchanged
* manual validation commands
* created Git commit

Do not provide lengthy repository explanations unless explicitly requested.
