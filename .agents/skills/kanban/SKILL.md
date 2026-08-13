---
name: ck:kanban
description: "AI agent orchestration board for task visualization and team coordination."
argument-hint: "[dir]"
---

# Plans Dashboard

Plans dashboard with progress tracking and timeline visualization.

## Usage

- `ck:kanban` - View dashboard for the configured plans directory
- `ck:kanban <dir>` - View dashboard for specific directory
- `ck:kanban --stop` - Stop running server

## Features

- Plan cards with progress bars
- Phase status breakdown (completed, in-progress, pending)
- Timeline/Gantt visualization
- Activity heatmap
- Issue and branch links

## Execution

**IMPORTANT:** Run the server as a background command when the runtime supports it, so it remains manageable from the active session.

The skill is located at `.agents/skills/plans-kanban/`.

### Stop Server

If `--stop` flag is provided:

```bash
node .agents/skills/plans-kanban/scripts/server.cjs --stop
```

### Start Server

Otherwise, run the kanban server with `--foreground` flag so the process stays alive:

```bash
# Determine plans directory
INPUT_DIR="$1"
PLANS_DIR="${INPUT_DIR:-${CK_PLANS_PATH:-plans}}"

# Start kanban dashboard
node .agents/skills/plans-kanban/scripts/server.cjs \
  --dir "$PLANS_DIR" \
  --host 0.0.0.0 \
  --open \
  --foreground
```

**Critical:** When calling the Bash tool:
- Set `run_in_background: true` when the shell tool supports background processes
- Set `timeout: 300000` (5 minutes) to prevent premature termination
- Parse JSON output and report URL to user

Example Bash tool call:
```json
{
  "command": "node .agents/skills/plans-kanban/scripts/server.cjs --dir \"${CK_PLANS_PATH:-plans}\" --host 0.0.0.0 --open --foreground",
  "run_in_background": true,
  "timeout": 300000,
  "description": "Start kanban server in background"
}
```

After starting, parse the JSON output and report:
- Local URL for browser access
- Network URL for remote device access (if available)
- Inform user that server is now running in the background when supported

**CRITICAL:** MUST display the FULL URL including path and query string. NEVER truncate to just `host:port`.

## Future Plans

The `ck:kanban` command will evolve into **VibeKanban-inspired** AI agent orchestration:

### Phase 1 (Current - MVP)
- Task board with progress tracking
- Visual representation of plans/tasks
- Click to view plan details

### Phase 2 (Worktree Integration)
- Create tasks → spawn git worktrees
- Assign agents to tasks
- Track agent progress per worktree

### Phase 3 (Full Orchestration)
- Parallel agent execution monitoring
- Code diff/review interface
- PR creation workflow
- Agent output streaming
- Conflict detection

Track progress in the configured repository's issue tracker (for example, issue #189).
