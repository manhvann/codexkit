# Codebase Summary

**Last Updated**: 2026-08-13  
**Version**: 0.1.8  
**Repository**: https://github.com/manhvann/codexkit

## Overview

CodexKit is a public, MIT-licensed Codex workspace kit for multi-repository
development. It installs reusable skills, agent definitions, hooks, guardrails,
planning templates, output styles, helper scripts, and project documentation.

The repository is an npm package and installer source. It is not an application
runtime and does not claim to provide a hosted service.

## Source layout

```text
codexkit/
├── .agents/skills/       # 68 documented Codex skills
├── .codex/agents/        # 14 TOML agent definitions
├── .codex/hooks/         # Hook implementations, dispatchers, and libraries
├── .codex/rules/         # Development and orchestration rules
├── .codex/scripts/       # Catalog, environment, docs, and utility scripts
├── .codex/output-styles/ # Communication profiles
├── docs/                 # Maintainer and architecture documentation
├── plans/templates/      # Reusable implementation-plan templates
├── scripts/              # npm installer and metadata validation
├── .github/              # Issue forms and pull-request template
├── README.md             # User-facing installation and usage guide
├── CONTRIBUTING.md       # Contribution workflow
├── SECURITY.md           # Vulnerability reporting policy
├── CHANGELOG.md          # Release history
└── package.json          # @manhnv319/codexkit package metadata
```

The installer copies the source `docs/` directory into the configured target's
`.codex/docs/` path. This distinction is intentional: source docs live at the
repository root, while installed workspace docs live under `.codex/`.

## Runtime components

### Skills

Each documented skill is a directory under `.agents/skills/` with a `SKILL.md`
entry point. Skills are invoked with Codex's dollar syntax, for example
`$plan`, `$cook`, `$test`, `$ck:scout`, and `$ck:preview`.

### Agents

Agent definitions are TOML files under `.codex/agents/`. They specify the role,
model, reasoning effort, sandbox policy, and developer instructions. The
current package contains 14 definitions, including planning, research,
implementation, testing, review, documentation, and release-support roles.

### Hooks and rules

`.codex/hooks.json` selects hook entry points. Hook code is kept in
`.codex/hooks/`, with shared logic under `.codex/hooks/lib/`. Rules under
`.codex/rules/` describe project detection, privacy checks, planning, testing,
and collaboration conventions.

## Package and validation

- Node.js: `>=18.0.0`
- Package: `@manhnv319/codexkit`
- Executable: `ckit`
- License: MIT
- `npm run check`: syntax and metadata validation
- `npm run pack:dry`: inspect the publishable tarball without publishing

The package has no runtime dependencies. Optional skills may install their own
tooling or Python dependencies when users explicitly enable them.

## Security and privacy posture

- Secrets and local environment files are excluded by `.gitignore` and
  `.npmignore`.
- Generated coverage, logs, caches, archives, and test fixtures are excluded
  from release artifacts.
- The repository has been scanned for personal identifiers, credentials, and
  legacy provider references before public publication.
- See `SECURITY.md` for vulnerability reporting.

## Current limitations

- This checkout does not contain a `.git` directory or GitHub history yet.
- CI workflows are intentionally not included in this package at this stage.
- Usage, stars, downloads, and maintainer activity must be measured after the
  public repository launch; no adoption numbers are claimed here.
