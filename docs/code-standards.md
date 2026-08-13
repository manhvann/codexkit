# Code Standards & Repository Structure

**Last Updated:** 2026-08-13  
**Version:** 0.1.9
**Applies To:** CodexKit source and release artifacts

## Principles

- Prefer small, composable changes (YAGNI, KISS, DRY).
- Keep user-owned files safe; use managed sections and explicit paths.
- Treat skill instructions and hook inputs as untrusted data.
- Never commit secrets, personal data, generated databases, logs, or private
  absolute paths.

## Layout rules

- `.agents/skills/<name>/SKILL.md` is the source of truth for a skill.
- `.codex/agents/*.toml` contains agent definitions.
- `.codex/hooks.json` selects hook entry points; shared code belongs in
  `.codex/hooks/lib/`.
- `.codex/rules/` contains workflow and safety rules.
- `scripts/` contains package-level installer and validation code.
- `docs/` contains source documentation; the installer maps it to the target's
  configured `.codex/docs/` path.
- `plans/templates/` contains reusable planning templates.

## Naming and implementation

- Use descriptive kebab-case skill directories and `SKILL.md` entry points.
- Use snake_case for TOML agent filenames when the role name contains words.
- Use `.cjs` for CommonJS hook modules and `.mjs` for package ESM scripts.
- Keep public commands and examples in Codex dollar syntax: `$plan`, `$cook`,
  `$ck:scout`.
- Validate paths before reading or writing them; reject traversal and broad
  destructive targets.
- Use `apply_patch` for focused source edits and preserve unrelated work.

## Validation

```bash
npm run check
npm run pack:dry
```

Run targeted Node/Python tests for changed modules. Before publication, scan
the full tree for credentials, personal identifiers, legacy provider names,
local paths, generated artifacts, and accidental archives.

## Release hygiene

- Keep `package.json`, README, docs, and `CHANGELOG.md` on the same version.
- Inspect `npm pack --dry-run` output before publishing.
- Keep `.gitignore` and `.npmignore` aligned with the secret and artifact
  policy.
- Do not claim CI, automated releases, adoption metrics, or integrations that
  are not present and validated in this repository.
