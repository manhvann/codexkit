# Codex Kit

Project-local Codex setup for serious multi-repository workspaces.

Current release: `0.1.9` · License: MIT · Repository: [github.com/manhvann/codexkit](https://github.com/manhvann/codexkit)

[![Release](https://img.shields.io/badge/RELEASE-v0.1.9-0e8a16?style=for-the-badge)](https://github.com/manhvann/codexkit/releases/tag/v0.1.9)
[![Skills](https://img.shields.io/badge/SKILLS-69-0b84d8?style=for-the-badge)](https://github.com/manhvann/codexkit/tree/main/.agents/skills)
[![Rules](https://img.shields.io/badge/RULES-5-8e44ad?style=for-the-badge)](https://github.com/manhvann/codexkit/tree/main/.codex/rules)
[![Output styles](https://img.shields.io/badge/OUTPUT%20STYLES-6-9b009b?style=for-the-badge)](https://github.com/manhvann/codexkit/tree/main/.codex/output-styles)
[![Agents](https://img.shields.io/badge/AGENTS-14-6f42c1?style=for-the-badge)](https://github.com/manhvann/codexkit/tree/main/.codex/agents)
[![Node.js](https://img.shields.io/badge/NODE.JS-18%2B-d4b000?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![License](https://img.shields.io/badge/LICENSE-MIT-55a91b?style=for-the-badge)](LICENSE)

Codex Kit installs a curated Codex workspace layer with skills, agents, hooks,
workflow rules, helper scripts, plan templates, output styles, and project
documentation. It is designed for umbrella repositories that contain many child
repos: keep the operational knowledge in the parent workspace, while Codex can
still reason about and work across the child projects cleanly.

## Why Use Codex Kit?

Most AI coding setups become messy in monorepos or workspace folders because
each child repository starts accumulating its own plans, docs, scripts, and
agent configuration. Codex Kit solves that by letting the umbrella folder act as
the coordination layer.

- Keep `plans`, `.codex/docs`, `.codex/scripts`, rules, hooks, and templates in
  the selected top-level target instead of scattering files across child repos.
- Wrap child repositories from the parent workspace so Codex can work across the
  whole system without polluting every project.
- Choose the exact target at setup time: install into the umbrella folder, or
  intentionally install into a specific child project when that is what you
  want.
- Select skills, agents, hooks, and Python runtime from an interactive terminal
  UI.
- Auto-detect project signals and recommend relevant skills and agents.
- Pin a shared Python environment, such as `~/.venv/shared/bin/python`, so
  Codex scripts do not accidentally use system Python.
- Install guardrails for privacy checks, scout blocking, development-rule
  reminders, plan/cook workflow reminders, and post-edit simplification.
- Preserve existing project conventions by writing managed sections instead of
  replacing user-owned content.

## Install

```bash
npm install -g @manhnv319/codexkit
```

Check that the CLI is available:

```bash
ckit --help
```

## Quick Start

From the umbrella folder that contains your repositories:

```bash
cd ~/Documents/projects/my-workspace
ckit
```

Running `ckit` with no arguments is equivalent to:

```bash
ckit --target .
```

By default, this opens the interactive selector. Use the arrow keys to move,
`Space` to select/toggle, and `Enter` to apply.

## Interactive Setup

The selector includes these tabs:

- `Target`: choose the umbrella folder or a detected child project.
- `Python`: choose `auto` or a detected Python interpreter.
- `Skills`: choose installed Codex skills.
- `Agents`: choose Codex agent roles.
- `Hooks`: choose runtime hooks and guardrails.
- `Review`: confirm the final setup before applying.

The Python tab scans common locations on macOS, Linux/Ubuntu, and Windows,
including project `.venv`, `~/.venv`, `~/.venv/shared`, `~/.virtualenvs`,
`~/.pyenv/versions`, Conda environments, Windows Python installs, and system
fallbacks. The selected value is stored in `.codex/.ck.json` as
`python.runner`.

## Recommended Umbrella Setup

Use this when one folder contains multiple repositories and you want Codex
workspace files to live only in the parent folder:

```bash
cd ~/Documents/projects/my-workspace
ckit
```

In the `Target` tab, keep `.` selected. This installs Codex Kit into the current
workspace folder. Plans, docs, scripts, rules, hooks, and templates stay in that
selected target.

Use this mode when you want a clean child-repo structure with no extra kit files
inside each application/service repository.

## Preview Changes

```bash
ckit --target . --dry-run --details
```

This prints detected project signals, recommendations, selected skills/agents,
selected hooks, the Python runner, and planned file actions without writing
anything.

## Apply Without the Selector

```bash
ckit --target . --yes
```

Pin a shared Python interpreter:

```bash
ckit --target . --python ~/.venv/shared/bin/python --yes
```

Use auto-detection explicitly:

```bash
ckit --target . --python auto --yes
```

## Child-Project Installs

If you intentionally want to install Codex Kit into a child repository, choose
that child project in the `Target` tab or pass it directly:

```bash
ckit --target ./backend-service
```

This is useful when a child repository is worked on independently and should own
its own `.codex`, `.agents`, `plans`, and `AGENTS.md` setup.

## Batch Mode

Preview detected child repositories:

```bash
ckit --all-projects --dry-run --details
```

Apply to detected child repositories:

```bash
ckit --all-projects --yes
```

Batch mode is intentionally different from the recommended umbrella setup. It
installs `.codex` and `.agents` configuration into each detected child project.
Use it only when you actually want child repositories to receive their own kit
files.

## Profiles

```bash
ckit --target . --profile default
ckit --target . --profile minimal --yes
ckit --target . --profile all --yes
```

- `default`: core kit plus project-specific recommendations.
- `minimal`: smaller setup with essential workflow skills and guardrails.
- `all`: install every available migrated skill, agent, and hook.
- `custom`: start from explicit selections passed through CLI flags.

Example custom setup:

```bash
ckit --target . \
  --profile custom \
  --with-recommended \
  --skills react-best-practices,tanstack,backend-development \
  --agents planner,tester,code_reviewer \
  --hooks privacy,scout,dev-rules \
  --python ~/.venv/shared/bin/python \
  --yes
```

## Useful Commands

```bash
ckit --list
ckit --target . --suggest-only
ckit --target . --dry-run --details
ckit --target . --repair-hook-wrappers
```

## Validation

Run the supported repository test suites with:

```bash
npm test
```

The core suites require only Node.js. Dashboard tests run automatically when
the optional plans-kanban dependency is installed:

```bash
npm install --prefix .agents/skills/plans-kanban
```

## What It Installs

- `.agents/skills`
- `.agents/skills` support files such as `common/`, `install.sh`, and
  `INSTALLATION.md`
- `.codex/agents`
- `.codex/hooks`
- `.codex/rules`
- `.codex/scripts`
- `.codex/output-styles`
- `.codex/docs`
- `.codex/.ck.json`
- `.codex/config.toml`
- `.codex/hooks.json`
- `plans/templates`
- a managed Codex Kit block in `AGENTS.md`

## Configuration Highlights

Codex Kit stores project preferences in `.codex/.ck.json`, including:

- `paths.plans`: where plan directories and reports should be created.
- `paths.docs`: where docs should be maintained.
- `python.runner`: selected Python interpreter or `auto`.
- `hooks`: enabled/disabled hook preferences.
- `plan`: naming, report, and validation behavior.

## Notes

Use `ckit --target .` for the clean umbrella-repo workflow. Use
`ckit --all-projects` only when you intentionally want to apply the kit to
detected child repos.

After applying Codex Kit, restart Codex in the target workspace so the new
skills, agents, hooks, and rules are loaded.

## License

MIT License. See `LICENSE` for details.

## Contributing and Support

- Contribution guide: [`CONTRIBUTING.md`](CONTRIBUTING.md)
- Security policy: [`SECURITY.md`](SECURITY.md)
- Support: [`SUPPORT.md`](SUPPORT.md)
- Change history: [`CHANGELOG.md`](CHANGELOG.md)
