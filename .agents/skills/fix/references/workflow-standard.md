# Standard Workflow

Full pipeline for moderate complexity issues. Uses runtime task tracking for phase tracking.

## Task Setup (Before Starting)

Create all phase tasks upfront with dependencies. See `references/task-orchestration.md`.

```
T1 = task creation(subject="Debug & investigate",  activeForm="Debugging issue")
T2 = task creation(subject="Scout related code",   activeForm="Scouting codebase")
T3 = task creation(subject="Implement fix",        activeForm="Implementing fix",    addBlockedBy=[T1, T2])
T4 = task creation(subject="Run tests",            activeForm="Running tests",       addBlockedBy=[T3])
T5 = task creation(subject="Code review",          activeForm="Reviewing code",      addBlockedBy=[T4])
T6 = task creation(subject="Finalize",             activeForm="Finalizing",          addBlockedBy=[T5])
```

## Steps

### Step 1: Debug & Investigate
`task update(T1, status="in_progress")`
Activate `ck:debug` skill. Use `debugger` subagent if needed.

- Read error messages, logs, stack traces
- Reproduce the issue
- Trace backward to root cause
- Identify all affected files

`task update(T1, status="completed")`
**Output:** `✓ Step 1: Root cause - [summary], [N] files affected`

### Step 2: Parallel Scout
`task update(T2, status="in_progress")`
Launch multiple `Explore` subagents in parallel to scout and verify the root cause.

**Pattern:** In SINGLE message, launch 2-3 Explore agents:
```
Task("Explore", "Find [area1] files related to issue", "Scout area1")
Task("Explore", "Find [area2] patterns/usage", "Scout area2")
Task("Explore", "Find [area3] tests/dependencies", "Scout area3")
```

- Only if unclear which files need changes
- Find patterns, similar implementations, dependencies

See `references/parallel-exploration.md` for patterns.

`task update(T2, status="completed")`
**Output:** `✓ Step 2: Scouted [N] areas - Found [M] related files`

### Step 3: Implement Fix
`task update(T3, status="in_progress")` — auto-unblocked when T1 + T2 complete.
Fix the issue following debugging findings.

- Apply `ck:problem-solving` skill if stuck
- Use `ck:sequential-thinking` for complex logic

**After implementation - Parallel Verification:**
Launch `Bash` agents in parallel to verify:
```
Task("Bash", "Run typecheck", "Verify types")
Task("Bash", "Run lint", "Verify lint")
Task("Bash", "Run build", "Verify build")
```

`task update(T3, status="completed")`
**Output:** `✓ Step 3: Implemented - [N] files, verified (types/lint/build passed)`

### Step 4: Test
`task update(T4, status="in_progress")`
Use `tester` subagent to run tests.

- Write new tests if needed
- Run existing test suite
- If fail → use `debugger`, fix, repeat

`task update(T4, status="completed")`
**Output:** `✓ Step 4: Tests [X/X passed]`

### Step 5: Review
`task update(T5, status="in_progress")`
Use `code_reviewer` subagent.

See `references/review-cycle.md` for mode-specific handling.

`task update(T5, status="completed")`
**Output:** `✓ Step 5: Review [score]/10 - [status]`

### Step 6: Finalize
`task update(T6, status="in_progress")`
- Report summary to user
- Ask to commit via `git_manager` subagent
- Update docs if needed via `docs_manager`

`task update(T6, status="completed")`
**Output:** `✓ Step 6: Complete - [action]`

## Skills/Subagents Activated

| Step | Skills/Subagents |
|------|------------------|
| 1 | `ck:debug`, `debugger` subagent |
| 2 | Multiple `Explore` subagents in parallel (optional) |
| 3 | `ck:problem-solving`, `ck:sequential-thinking`, parallel `Bash` for verification |
| 4 | `tester` subagent |
| 5 | `code_reviewer` subagent |
| 6 | `git_manager`, `docs_manager` subagents |

**Rules:** Don't skip steps. Validate before proceeding. One phase at a time.
**Frontend:** Use `chrome`, `ck:chrome-devtools` or any relevant skills/tools to verify.
**Visual Assets:** Use `ck:ai-multimodal` for visual assets generation, analysis and verification.
