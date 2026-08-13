# Log Analysis Fix Workflow

For fixing issues from application logs. Uses runtime task tracking for phase tracking.

## Prerequisites
- Log file at `./logs.txt` or similar

## Setup (if logs missing)

Add permanent log piping to project config:
- **Bash/Unix**: `command 2>&1 | tee logs.txt`
- **PowerShell**: `command *>&1 | Tee-Object logs.txt`

## Task Setup (Before Starting)

```
T1 = task creation(subject="Read & analyze logs",  activeForm="Analyzing logs")
T2 = task creation(subject="Scout codebase",        activeForm="Scouting codebase",    addBlockedBy=[T1])
T3 = task creation(subject="Plan fix",              activeForm="Planning fix",          addBlockedBy=[T1, T2])
T4 = task creation(subject="Implement fix",         activeForm="Implementing fix",      addBlockedBy=[T3])
T5 = task creation(subject="Test fix",              activeForm="Testing fix",           addBlockedBy=[T4])
T6 = task creation(subject="Code review",           activeForm="Reviewing code",        addBlockedBy=[T5])
```

## Workflow

### Step 1: Read & Analyze Logs
`task update(T1, status="in_progress")`

- Read logs with `Grep` (use `head_limit: 30` initially, increase if needed)
- Use `debugger` agent for root cause analysis
- Focus on last N lines first (most recent errors)
- Look for stack traces, error codes, timestamps, repeated patterns

`task update(T1, status="completed")`

### Step 2: Scout Codebase
`task update(T2, status="in_progress")`
Use `ck:scout` agent or parallel `Explore` subagents to find issue locations.

See `references/parallel-exploration.md` for patterns.

`task update(T2, status="completed")`

### Step 3: Plan Fix
`task update(T3, status="in_progress")` — auto-unblocks when T1 + T2 complete.
Use `planner` agent.

`task update(T3, status="completed")`

### Step 4: Implement
`task update(T4, status="in_progress")`
Implement the fix.

`task update(T4, status="completed")`

### Step 5: Test
`task update(T5, status="in_progress")`
Use `tester` agent. If issues remain → keep T5 `in_progress`, loop back to Step 2.

`task update(T5, status="completed")`

### Step 6: Review
`task update(T6, status="in_progress")`
Use `code_reviewer` agent.

`task update(T6, status="completed")`

## Tips
- Focus on last N lines first (most recent errors)
- Look for stack traces, error codes, timestamps
- Check for patterns/repeated errors
