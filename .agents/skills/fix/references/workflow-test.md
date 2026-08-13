# Test Failure Fix Workflow

For fixing failing tests and test suite issues. Uses runtime task tracking for phase tracking.

## Task Setup (Before Starting)

```
T1 = task creation(subject="Compile & collect failures", activeForm="Compiling and collecting failures")
T2 = task creation(subject="Debug root causes",          activeForm="Debugging test failures",       addBlockedBy=[T1])
T3 = task creation(subject="Plan fixes",                 activeForm="Planning fixes",                addBlockedBy=[T2])
T4 = task creation(subject="Implement fixes",             activeForm="Implementing fixes",            addBlockedBy=[T3])
T5 = task creation(subject="Re-test",                     activeForm="Re-running tests",              addBlockedBy=[T4])
T6 = task creation(subject="Code review",                 activeForm="Reviewing code",                addBlockedBy=[T5])
```

## Workflow

### Step 1: Compile & Collect Failures
`task update(T1, status="in_progress")`
Use `tester` agent. Fix all syntax errors before running tests.

- Run full test suite, collect all failures
- Group failures by module/area

`task update(T1, status="completed")`

### Step 2: Debug
`task update(T2, status="in_progress")`
Use `debugger` agent for root cause analysis.

- Analyze each failure group
- Identify shared root causes across failures

`task update(T2, status="completed")`

### Step 3: Plan
`task update(T3, status="in_progress")`
Use `planner` agent for fix strategy.

- Prioritize fixes (shared root causes first)
- Identify dependencies between fixes

`task update(T3, status="completed")`

### Step 4: Implement
`task update(T4, status="in_progress")`
Implement fixes step by step per plan.

`task update(T4, status="completed")`

### Step 5: Re-test
`task update(T5, status="in_progress")`
Use `tester` agent. If tests still fail → keep T5 `in_progress`, loop back to Step 2.

`task update(T5, status="completed")`

### Step 6: Review
`task update(T6, status="in_progress")`
Use `code_reviewer` agent.

`task update(T6, status="completed")`

## Common Commands
```bash
npm test
bun test
pytest
go test ./...
```

## Tips
- Run single failing test first for faster iteration
- Check test assertions vs actual behavior
- Verify test fixtures/mocks are correct
- Don't modify tests to pass unless test is wrong
