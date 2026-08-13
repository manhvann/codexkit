# Subagent Patterns

Standard patterns for using Codex agents in cook workflows.

## Delegation Pattern

Use the runtime's native subagent/delegation tool when available. The exact API varies by Codex surface, so do not invent a `Task(...)` function if it is not exposed.

`ck:cook` invocation is explicit authorization to delegate these workflow phases unless the user says not to delegate. If subagents are unavailable or forbidden by the environment, run the step inline and state the fallback.

## Generic Shape
```
agent="[type]"
prompt="[task description]"
description="[brief]"
```

## Research Phase
```
agent="researcher", prompt="Research [topic]. Report <=150 lines.", description="Research [topic]"
```
- Use multiple researchers in parallel for different topics
- Keep reports ≤150 lines with citations

## Scout Phase
```
agent="scout", prompt="Find files related to [feature] in codebase", description="Scout [feature]"
```
- Use `$ck:scout ext` (preferred) or `$ck:scout` (fallback)

## Planning Phase
```
agent="planner", prompt="Create implementation plan based on reports: [reports]. Save to [path]", description="Plan [feature]"
```
- Input: researcher and scout reports
- Output: `plan.md` + `phase-XX-*.md` files

## UI Implementation
```
agent="ui_ux_designer", prompt="Implement [feature] UI per <configured-docs>/design-guidelines.md", description="UI [feature]"
```
- For frontend work
- Follow design guidelines

## Testing
```
agent="tester", prompt="Run test suite for plan phase [phase-name]", description="Test [phase]"
```
- Must achieve 100% pass rate

## Debugging
```
agent="debugger", prompt="Analyze failures: [details]", description="Debug [issue]"
```
- Use when tests fail
- Provides root cause analysis

## Code Review
```
agent="code_reviewer", prompt="Review changes for [phase]. Check security, performance, YAGNI/KISS/DRY. Return score (X/10), critical, warnings, suggestions.", description="Review [phase]"
```

## Project Management
```
agent="project_manager", prompt="Run full sync-back in [plan-path]: reconcile completed tasks/checklists with all phase files, backfill stale completed checkboxes across all phases, update plan.md status/progress, and report unresolved mappings.", description="Update plan"
```

## Documentation
```
agent="docs_manager", prompt="Update docs for [phase]. Changed files: [list]", description="Update docs"
```

## Git Operations
```
agent="git_manager", prompt="Stage and commit changes with conventional commit message", description="Commit changes"
```

## Parallel Execution
```
agent="fullstack_developer", prompt="Implement [phase-file] with file ownership: [files]", description="Implement phase [N]"
```
- Launch multiple for parallel phases
- Include file ownership boundaries
