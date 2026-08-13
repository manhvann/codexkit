# Scout Task Management Patterns

Track parallel scout agent execution via runtime task tracking (task creation, task update, task list).

## When to Create Tasks

| Agents | Create Tasks? | Rationale |
|--------|--------------|-----------|
| ≤ 2    | No           | Overhead exceeds benefit, finishes quickly |
| ≥ 3    | Yes          | Meaningful coordination, progress monitoring |

## Task Registration Flow

```
task list()                          // Check for existing scout tasks
  → Found tasks?  → Skip creation, reuse existing
  → Empty?        → task creation per agent (see schema below)
```

## Metadata Schema

```
task creation(
  subject: "Scout {directory} for {target}",
  activeForm: "Scouting {directory}",
  description: "Search {directories} for {patterns}",
  metadata: {
    agentType: "Explore",        // "Explore" (internal) or "Bash" (external)
    scope: "src/auth/,src/middleware/",
    scale: 6,
    agentIndex: 1,               // 1-indexed position
    totalAgents: 6,
    toolMode: "internal",        // "internal" or "external"
    priority: "P2",              // Always P2 for scout coordination
    effort: "3m"                 // Fixed timeout per agent
  }
)
```

### Required Fields

- `agentType` — Subagent type: `"Explore"` for internal, `"Bash"` for external
- `scope` — Comma-separated directory boundaries for this agent
- `scale` — Total SCALE value determined in Step 1
- `agentIndex` / `totalAgents` — Position tracking (e.g., 3 of 6)
- `toolMode` — `"internal"` or `"external"`
- `priority` — Always `"P2"` (scout = coordination, not primary work)
- `effort` — Always `"3m"` (fixed timeout)

### Optional Fields

- `searchPatterns` — Key patterns searched (aids debugging)
- `externalTool` — If external: `"gemini"` or `"opencode"`

## Task Lifecycle

```
Step 3: task creation per agent     → status: pending
Step 4: Before spawning agent    → task update → status: in_progress
Step 5: Agent returns report     → task update → status: completed
Step 5: Agent times out (3m)     → Keep in_progress, add error metadata
```

### Timeout Handling

```
task update(taskId, {
  metadata: { ...existing, error: "timeout" }
})
// Task stays in_progress — distinguishes timeout from incomplete
// Log in final report's "Unresolved Questions" section
```

## Examples

### Internal Scouting (SCALE=6)

```
// Step 3: Register 6 tasks
task creation(subject: "Scout src/auth/ for auth files",
  activeForm: "Scouting src/auth/",
  metadata: { agentType: "Explore", scope: "src/auth/", scale: 6,
              agentIndex: 1, totalAgents: 6, toolMode: "internal",
              priority: "P2", effort: "3m" })  // → taskId1

// Repeat for agents 2-6 with different scopes

// Step 4: Spawn agents
task update(taskId1, { status: "in_progress" })
// ... spawn all Explore subagents in single Task tool call

// Step 5: Collect
task update(taskId1, { status: "completed" })  // report received
task update(taskId3, { metadata: { error: "timeout" } })  // timed out
```

### External Scouting (SCALE=3, gemini)

```
task creation(subject: "Scout db/ for migrations via gemini",
  activeForm: "Scouting db/ via gemini",
  metadata: { agentType: "Bash", scope: "db/,migrations/", scale: 3,
              agentIndex: 1, totalAgents: 3, toolMode: "external",
              externalTool: "gemini", priority: "P2", effort: "3m" })
```

## Integration with Cook/Planning

Scout tasks are **independent** from cook/planning phase tasks — NOT parent-child.

**Rationale:** Different lifecycle. Scout completes before cook continues. Mixing creates confusion in task list.

**Sequence when cook spawns scout:**
1. Cook Step 2 → spawns planner → planner spawns scout
2. Scout registers its own tasks (Step 3), executes (Step 4-5)
3. Scout returns aggregated report → planner continues
4. Cook Step 3 hydrates phase tasks (separate from scout tasks)

## Quality Check Output

After registration: `✓ Registered [N] scout tasks ([internal|external] mode, SCALE={scale})`

## Error Handling

If `task creation` fails: log warning, continue without task tracking. Scout remains fully functional — tasks add observability, not functionality.
