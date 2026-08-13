---
name: ck:cook
description: "ALWAYS activate this skill before implementing EVERY feature, plan, or fix."
version: 2.1.1
argument-hint: "[task|plan-path] [--interactive|--fast|--parallel|--auto|--no-test]"
---

# Cook - Smart Feature Implementation

End-to-end implementation with automatic workflow detection.

**Principles:** YAGNI, KISS, DRY | Token efficiency | Concise reports

## Usage

```
$cook <natural language task OR plan path>
```

**IMPORTANT:** If no flag is provided, the skill will use the `interactive` mode by default for the workflow.

**Optional flags to select the workflow mode:** 
- `--interactive`: Full workflow with user input (**default**)
- `--fast`: Skip research, scout→plan→code
- `--parallel`: Multi-agent execution
- `--no-test`: Skip testing step
- `--auto`: Auto-approve all steps

**Example:**
```
$cook "Add user authentication to the app" --fast
$cook path/to/plan.md --auto
```

## Smart Intent Detection

| Input Pattern | Detected Mode | Behavior |
|---------------|---------------|----------|
| Path to `plan.md` or `phase-*.md` | code | Execute existing plan |
| Contains "fast", "quick" | fast | Skip research, scout→plan→code |
| Contains "trust me", "auto" | auto | Auto-approve all steps |
| Lists 3+ features OR "parallel" | parallel | Multi-agent execution |
| Contains "no test", "skip test" | no-test | Skip testing step |
| Default | interactive | Full workflow with user input |

See `references/intent-detection.md` for detection logic.

## Workflow Overview

```
[Intent Detection] → [Research?] → [Review] → [Plan] → [Review] → [Implement] → [Review] → [Test?] → [Review] → [Finalize]
```

**Default (non-auto):** Stops at `[Review]` gates for human approval before each major step.
**Auto mode (`--auto`):** Skips human review gates, implements all phases continuously.
**Task tracking:** Use the available task-tracking tools when the runtime exposes them. If task tools are unavailable, keep an explicit checklist in the response and plan files instead.

| Mode | Research | Testing | Review Gates | Phase Progression |
|------|----------|---------|--------------|-------------------|
| interactive | ✓ | ✓ | **User approval at each step** | One at a time |
| auto | ✓ | ✓ | Auto if score≥9.5 | All at once (no stops) |
| fast | ✗ | ✓ | **User approval at each step** | One at a time |
| parallel | Optional | ✓ | **User approval at each step** | Parallel groups |
| no-test | ✓ | ✗ | **User approval at each step** | One at a time |
| code | ✗ | ✓ | **User approval at each step** | Per plan |

## Step Output Format

```
✓ Step [N]: [Brief status] - [Key metrics]
```

## Blocking Gates (Non-Auto Mode)

Human review required at these checkpoints (skipped with `--auto`):
- **Post-Research:** Review findings before planning
- **Post-Plan:** Approve plan before implementation
- **Post-Implementation:** Approve code before testing
- **Post-Testing:** 100% pass + approve before finalize

**Always enforced (all modes):**
- **Testing:** 100% pass required (unless no-test mode)
- **Code Review:** User approval OR auto-approve (score≥9.5, 0 critical)
- **Finalize (MANDATORY - never skip):**
  1. Prefer `project_manager` subagent → run full plan sync-back (all completed tasks/steps across all `phase-XX-*.md`, not only current phase), then update `plan.md` status/progress
  2. Prefer `docs_manager` subagent → update the configured docs path if changes warrant
  3. Update task state/checklists after sync-back verification
  4. Ask user if they want to commit; prefer `git_manager` subagent when available

## Delegation Policy

Invoking `ck:cook` is explicit user authorization to use the installed Codex agents for the workflow phases below, unless the user says not to delegate.

| Phase | Agent | Requirement |
|-------|-------|-------------|
| Research | `researcher` | Optional in fast/code |
| Scout | `ck:scout` | Optional in code |
| Plan | `planner` | Optional in code |
| UI Work | `ui_ux_designer` | If frontend work |
| Testing | `tester`, `debugger` | Prefer delegation when available |
| Review | `code_reviewer` | Prefer delegation when available |
| Finalize | `project_manager`, `docs_manager`, `git_manager` | Prefer delegation when available |

**Runtime compatibility:**
- If the Codex runtime exposes a subagent/delegation tool, use it for testing, review, and finalize.
- If the runtime does not expose subagent tools or the environment forbids spawning, do not block the workflow. Perform the step inline, clearly report "subagent unavailable; ran inline", and preserve the same quality gates.
- Do not invent a `Task(...)` API if it is not available in the current runtime.
- Pattern when available: use the runtime's native subagent tool with agent type, prompt, and brief description.

## References

- `references/intent-detection.md` - Detection rules and routing logic
- `references/workflow-steps.md` - Detailed step definitions for all modes
- `references/review-cycle.md` - Interactive and auto review processes
- `references/subagent-patterns.md` - Subagent invocation patterns
