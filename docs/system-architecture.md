# System Architecture

**Last Updated:** 2026-08-13  
**Version:** 0.1.9
**Project:** CodexKit

> This document describes the current package layout. Optional skills and
> conceptual collaboration patterns are not hosted services or guaranteed
> runtime features.

## Architecture at a glance

```text
                 ┌──────────────────────────┐
                 │ npm package: @manhnv319/   │
                 │ codexkit                 │
                 └────────────┬─────────────┘
                              │ ckit
                              ▼
                 ┌──────────────────────────┐
                 │ target workspace         │
                 │ .codex + .agents + plans │
                 └────────────┬─────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
     skills                agents                 hooks
  .agents/skills/       .codex/agents/         .codex/hooks/
        │                     │                     │
        └────────────── Codex runtime ──────────────┘
```

## Package boundary

The npm package contains the installer, source skills, agent definitions,
hooks, rules, output styles, templates, docs, and validation scripts. It does
not run a server and does not require a hosted backend.

## Installer flow

1. Detect the selected target and child repositories.
2. Resolve profile, skill, agent, hook, and Python selections.
3. Show a dry-run or interactive review.
4. Copy managed files and preserve user-owned content.
5. Write target configuration and report the result.

The installer entry point is `scripts/apply-codex-kit.mjs`; package metadata is
checked by `scripts/validate-codex-kit-metadata.mjs`.

## Skills

Skills are filesystem-discoverable directories under `.agents/skills/`. Each
documented skill has a `SKILL.md` file with metadata, usage, workflow, and
references. Skills compose through Codex's `$skill` command syntax and may call
optional tools or dependencies documented within the skill.

## Agents

Agent TOML files under `.codex/agents/` describe role instructions and model
settings. The current package includes 14 roles for planning, research,
implementation, testing, review, documentation, project management, and
supporting workflows. The runtime may expose additional collaboration tools;
the repository does not implement a hosted agent scheduler.

## Hooks and safety

`.codex/hooks.json` selects hook entry points. Hooks provide project detection,
context construction, privacy checks, scout/path guardrails, reminders, and
notifications. Shared logic is under `.codex/hooks/lib/`.

Hook code must:

- validate and constrain filesystem paths;
- avoid logging credentials or private content;
- fail safely when optional context is unavailable;
- preserve user-owned files and configuration;
- be tested directly when changed.

## Documentation and plans

Source documentation lives in `docs/`; installed targets receive it under the
configured `.codex/docs/` path. Plan templates live in `plans/templates/`.
Generated plans, reports, logs, screenshots, and coverage files are local
artifacts and are excluded from release output.

## Validation and release

```bash
npm run check
npm run pack:dry
```

No CI workflow or automated release service is part of version 0.1.9. Public
release evidence should come from the GitHub repository, tagged releases,
package inspection, and reproducible local validation.
