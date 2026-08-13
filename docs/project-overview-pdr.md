# Project Overview & Product Development Requirements

**Project Name:** CodexKit  
**Version:** 0.1.8  
**Last Updated:** 2026-08-13  
**Status:** Public OSS preparation  
**Repository:** https://github.com/manhvann/codexkit

## Product summary

CodexKit is an npm-distributed workspace kit for Codex users working across
multiple repositories. It centralizes skills, agent roles, hooks, rules, plans,
documentation, and environment configuration in an umbrella workspace while
preserving child-project conventions.

## Target users

- Open-source maintainers who review issues and pull requests across several
  repositories.
- Teams that want repeatable planning, implementation, testing, and review
  workflows in Codex.
- Developers who need privacy checks and predictable project-local Codex setup.

## Requirements

### Functional

1. Install the kit with `npm install -g @manhnv319/codexkit` and run `ckit`.
2. Support an explicit target directory, dry-run preview, profiles, and
   selected skills/agents/hooks.
3. Keep source skills under `.agents/skills/` and installed workspace docs under
   the configured `.codex/docs/` path.
4. Provide 14 agent definitions and a discoverable collection of documented
   skills.
5. Protect secrets, local environment files, logs, caches, and generated
   artifacts from source and package publication.
6. Validate installer syntax and package metadata with `npm run check`.

### Non-functional

- Node.js `>=18.0.0`.
- MIT licensing and public contribution guidance.
- Cross-platform shell and path handling where supported by the installer.
- Clear failure messages and safe dry-run behavior.
- No requirement for a hosted service, API key, or CI provider for the base kit.

## User workflow

```text
select target → preview changes → apply kit → restart Codex → use $skills
```

Typical skill commands include `$plan`, `$cook`, `$test`, `$fix`, `$docs`, and
`$ck:scout`. The exact available skills depend on the installed package and
runtime.

## Quality and security

- Run `npm run check` before publishing.
- Run `npm run pack:dry` to inspect the release contents.
- Run targeted tests for changed hooks or skills.
- Never commit credentials, private paths, personal identifiers, or generated
  coverage databases.
- Report vulnerabilities through `SECURITY.md`.

## Current constraints

- This repository is preparing for its first public GitHub launch.
- Adoption metrics are not claimed until the repository is public.
- CI, automated releases, and hosted workflows are not included in version
  0.1.8.
- Optional skills may require additional packages or API keys, documented by
  those skills separately.

## Acceptance criteria for the public launch

- Public GitHub repository and maintainer profile.
- Consistent package version, repository metadata, README, and changelog.
- License, contribution, conduct, support, and security policies present.
- No legacy provider names, secrets, personal data, or local artifacts in the
  publishable tree.
- Dry-run package inspection and metadata validation pass.
