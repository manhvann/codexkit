# Deep Workflow

Full pipeline with research, brainstorming, and planning for complex issues. Uses runtime task tracking with dependency chains.

## Task Setup (Before Starting)

Create all phase tasks upfront. Steps 1+2 run in parallel (no mutual dependency).

```
T1 = task creation(subject="Debug & investigate",       activeForm="Debugging issue",       metadata={phase: "diagnose"})
T2 = task creation(subject="Research solutions",         activeForm="Researching solutions",  metadata={phase: "research"})
T3 = task creation(subject="Brainstorm approaches",      activeForm="Brainstorming",          metadata={phase: "design"},    addBlockedBy=[T1, T2])
T4 = task creation(subject="Create implementation plan", activeForm="Planning implementation", metadata={phase: "design"},    addBlockedBy=[T3])
T5 = task creation(subject="Implement fix",              activeForm="Implementing fix",        metadata={phase: "implement"}, addBlockedBy=[T4])
T6 = task creation(subject="Run tests",                  activeForm="Running tests",           metadata={phase: "verify"},    addBlockedBy=[T5])
T7 = task creation(subject="Code review",                activeForm="Reviewing code",          metadata={phase: "verify"},    addBlockedBy=[T6])
T8 = task creation(subject="Finalize & docs",            activeForm="Finalizing",              metadata={phase: "finalize"},  addBlockedBy=[T7])
```

## Steps

### Step 1: Debug & Parallel Investigation
`task update(T1, status="in_progress")`
Activate `ck:debug` skill. Launch 2-3 `Explore` subagents in parallel:
```
Task("Explore", "Find error origin", "Trace error")
Task("Explore", "Find affected components", "Map deps")
Task("Explore", "Find similar patterns", "Find patterns")
```
See `references/parallel-exploration.md` for patterns.

`task update(T1, status="completed")`
**Output:** `✓ Step 1: Root cause - [summary], system impact: [scope]`

### Step 2: Research (parallel with Step 1)
`task update(T2, status="in_progress")`
Use `researcher` subagent for external knowledge.

- Search latest docs, best practices
- Find similar issues/solutions
- Gather security advisories if relevant

`task update(T2, status="completed")`
**Output:** `✓ Step 2: Research complete - [key findings]`

### Step 3: Brainstorm
`task update(T3, status="in_progress")` — auto-unblocks when T1 + T2 complete.
Activate `ck:brainstorm` skill.

- Evaluate multiple approaches
- Consider trade-offs
- Get user input on preferred direction

`task update(T3, status="completed")`
**Output:** `✓ Step 3: Approach selected - [chosen approach]`

### Step 4: Plan
`task update(T4, status="in_progress")`
Use `planner` subagent to create implementation plan.

- Break down into phases
- Identify dependencies
- Define success criteria

`task update(T4, status="completed")`
**Output:** `✓ Step 4: Plan created - [N] phases`

### Step 5: Implement
`task update(T5, status="in_progress")`
Implement per plan. Use `ck:context-engineering`, `ck:sequential-thinking`, `ck:problem-solving`.

**Parallel Verification:** Launch `Bash` agents: typecheck + lint + build
See `references/parallel-exploration.md`

`task update(T5, status="completed")`
**Output:** `✓ Step 5: Implemented - [N] files, [M] phases, verified`

### Step 6: Test
`task update(T6, status="in_progress")`
Use `tester` subagent.

- Comprehensive testing
- Edge cases, security, performance
- If fail → debug, fix, repeat

`task update(T6, status="completed")`
**Output:** `✓ Step 6: Tests [X/X passed]`

### Step 7: Review
`task update(T7, status="in_progress")`
Use `code_reviewer` subagent.

See `references/review-cycle.md` for mode-specific handling.

`task update(T7, status="completed")`
**Output:** `✓ Step 7: Review [score]/10 - [status]`

### Step 8: Finalize
`task update(T8, status="in_progress")`
- Use `project_manager` subagent to update roadmap
- Use `docs_manager` subagent for documentation
- Use `git_manager` subagent for commit

`task update(T8, status="completed")`
**Output:** `✓ Step 8: Complete - [actions taken]`

## Skills/Subagents Activated

| Step | Skills/Subagents |
|------|------------------|
| 1 | `ck:debug`, parallel `Explore` subagents for investigation |
| 2 | `researcher` (runs parallel with step 1) |
| 3 | `ck:brainstorm` |
| 4 | `planner` |
| 5 | `ck:problem-solving`, `ck:sequential-thinking`, `ck:context-engineering`, parallel `Bash` |
| 6 | `tester` |
| 7 | `code_reviewer` |
| 8 | `project_manager`, `docs_manager`, `Bash` |

**Rules:** Don't skip steps. Validate before proceeding. One phase at a time.
**Frontend:** Use `chrome`, `ck:chrome-devtools` or any relevant skills/tools to verify.
**Visual Assets:** Use `ck:ai-multimodal` for visual assets generation, analysis and verification.
