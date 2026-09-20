# Repository Agent Instructions

## General

This repository is a pnpm monorepo.

Work conservatively and keep the scope of every task as small as possible.

Do not expand the requested scope based on issues discovered during the task.

If an unrelated problem is discovered, report it at the end instead of fixing it.

Prefer modifying existing architecture over introducing new abstractions, dependencies, or infrastructure.

## Repository exploration

Before modifying code, inspect only the files necessary to understand the requested area.

Do not perform exhaustive repository-wide analysis unless explicitly requested.

Do not generate full dependency graphs, import graphs, dead-code reports, or architecture reports unless explicitly requested.

Do not inspect generated or dependency directories unless a specific problem requires it:

* node_modules/
* .next/
* dist/
* build/
* coverage/
* .turbo/
* generated/

Do not read framework documentation from node_modules.

Do not search the web unless explicitly requested or required because the repository does not contain enough information to proceed.

Prefer existing repository code and configuration as the source of truth.

## Scope control

Only modify files directly required for the requested task.

Do not fix unrelated bugs, warnings, type errors, security issues, lint issues, or architectural problems.

When an unrelated issue is discovered:

1. Leave it unchanged.
2. Record the file and issue.
3. Report it after completing the requested task.

Do not modify another application merely because it shares code with the application currently being changed unless the requested task requires that modification.

Do not perform opportunistic refactoring.

Do not remove apparently unused code unless explicitly requested.

Before deleting code, confirm that it has no relevant references.

## Existing user changes

Preserve all pre-existing user modifications.

Never overwrite, revert, clean, reset, or discard changes that existed before the current task.

Do not use destructive Git commands.

Never use:

* git reset --hard
* git clean -fd
* git checkout -- .
* git restore .

Treat unrelated modified files as user-owned changes.

## Validation

The user performs runtime validation manually.

Do not automatically run:

* tests
* typecheck
* lint
* build
* Docker builds
* development servers
* production servers
* browser automation
* end-to-end tests

Do not create new tests unless explicitly requested.

Do not run validation commands after making changes unless explicitly requested.

Perform only static review of the changed code.

Check relevant imports, types, call sites, and obvious syntax issues by reading the affected files.

At the end, provide the exact commands the user can run manually to validate the work.

## Commands

Avoid commands that scan the entire repository when a targeted command can answer the same question.

Prefer targeted searches such as:

* rg within the relevant app or package
* reading specific package.json files
* reading directly related imports and call sites

Avoid custom scripts that crawl every TypeScript or JavaScript file unless explicitly requested.

Keep terminal output small and relevant.

## Architecture

Do not redesign repository architecture during ordinary implementation tasks.

If the existing architecture blocks the requested task:

1. Identify the exact blocking issue.
2. Make the smallest change necessary to unblock the task.
3. Explain the reason in the final summary.

Do not perform broader cleanup at the same time.

## Dependencies

Do not add, remove, or upgrade dependencies unless required by the requested task.

Prefer dependencies already present in the repository.

Do not upgrade framework or package versions as part of unrelated work.

## Git workflow

Use Git to preserve a useful history of completed work.

Inspect git status before modifying files.

After completing one logical task:

1. Inspect the relevant diff.
2. Commit only files belonging to that task.
3. Use a concise commit message describing the actual change.

Do not include unrelated pre-existing user changes in commits.

Do not push.

Do not amend, squash, rebase, or rewrite existing commits unless explicitly requested.

Prefer one commit per logical task rather than one commit per file.

## Questions

Do not ask questions when the answer can be determined safely from the existing repository.

If a product decision genuinely cannot be inferred, ask only the minimum question required to continue.

Do not repeatedly stop implementation for minor implementation choices.

## Completion report

Keep the final report concise.

Include:

* what was changed
* files or areas affected
* unrelated issues discovered but intentionally left unchanged
* manual validation commands
* Git commit created

Do not include lengthy explanations of repository structure unless reque
