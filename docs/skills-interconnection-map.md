# CodexKit Skills Interconnection Map

> 68 documented skills · composable workflows · 1 ecosystem

## Core workflow

```text
task → $ask / $brainstorm
     → $scout
     → $plan
     → $cook
     → $test
     → $code-review / $fix
     → $docs / $watzup
```

The arrows describe recommended composition, not a hard dependency graph.
Users can invoke a single skill when the task does not require the full flow.

## Skill groups

- **Planning:** `plan`, `scout`, `research`, `brainstorm`, `ask`, `cook`
- **Quality:** `test`, `debug`, `fix`, `code-review`, `problem-solving`,
  `sequential-thinking`
- **Documentation:** `docs`, `docs-seeker`, `repomix`, `preview`, `ck-help`
- **Workspace:** `bootstrap`, `worktree`, `project-management`, `kanban`,
  `journal`, `watzup`, `git`, `coding-level`
- **Development:** backend, frontend, web, mobile, databases, DevOps, and
  framework-specific skills
- **Media and tools:** AI multimodal, image, media, MCP, PDF, PPTX, XLSX, and
  supporting utility skills

## Invocation convention

Use Codex's dollar syntax in documentation and user instructions:

```text
$plan --fast "task"
$cook plans/example/plan.md --auto
$ck:scout ext
$ck:preview docs/report.md
```

Skill availability depends on the installed profile and runtime. This map is a
guide to the source tree, not a promise that every optional tool is installed.
