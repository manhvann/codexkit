# Unified Workflow Steps

All modes share core steps with mode-specific variations.

## Step 0: Intent Detection & Setup

1. Parse input with `intent-detection.md` rules
2. Log detected mode: `✓ Step 0: Mode [X] - [reason]`
3. If mode=code: detect plan path, set active plan
4. Use `task creation` to create workflow step tasks (with dependencies if complex)

**Output:** `✓ Step 0: Mode [interactive|auto|fast|parallel|no-test|code] - [detection reason]`

## Step 1: Research (skip if fast/code mode)

**Interactive/Auto:**
- Spawn multiple `researcher` agents in parallel
- Use `$ck:scout ext` or `scout` agent for codebase search
- Keep reports ≤150 lines

**Parallel:**
- Optional: max 2 researchers if complex

**Output:** `✓ Step 1: Research complete - [N] reports gathered`

### [Review Gate 1] Post-Research (skip if auto mode)
- Present research summary to user
- Use `ask the user` to ask: "Proceed to planning?" / "Request more research" / "Abort"
- **Auto mode:** Skip this gate

## Step 2: Planning

**Interactive/Auto/No-test:**
- Use `planner` agent with research context
- Create `plan.md` + `phase-XX-*.md` files

**Fast:**
- Use `$ck:plan --fast` with scout results only
- Minimal planning, focus on action

**Parallel:**
- Use `$ck:plan --parallel` for dependency graph + file ownership matrix

**Code:**
- Skip - plan already exists
- Parse existing plan for phases

**Output:** `✓ Step 2: Plan created - [N] phases`

### [Review Gate 2] Post-Plan (skip if auto mode)
- Present plan overview with phases
- Use `ask the user` to ask: "Validate the plan or approve plan to start implementation?" - "Validate" / "Approve" / "Abort" / "Other" ("Request revisions")
  - "Validate": run `$ck:plan validate` skill command
  - "Approve": continue to implementation
  - "Abort": stop the workflow
  - "Other": revise the plan based on user's feedback
- **Auto mode:** Skip this gate

## Step 3: Implementation

**IMPORTANT:**
1. Use task-tracking tools first if available — check for existing tasks (hydrated by planning skill in same session)
2. If tasks exist → pick them up, skip re-creation
3. If no tasks → read plan phases, create task records if available; otherwise maintain an explicit checklist for each unchecked `[ ]` item with priority order and metadata (`phase`, `planDir`, `phaseFile`)
4. Tasks can be blocked by other tasks via `addBlockedBy`

**All modes:**
- Use task tracking to mark tasks as `in_progress` immediately when available.
- Execute phase tasks sequentially (Step 3.1, 3.2, etc.)
- Use `ui_ux_designer` for frontend
- Use `ck:ai-multimodal` for image assets
- Run type checking after each file

**Parallel mode:**
- Utilize available task tools for create/update/get/list operations when the runtime exposes them.
- Launch multiple `fullstack_developer` agents
- When agents pick up a task, update task state and assignment immediately when tooling supports it.
- Respect file ownership boundaries
- Wait for parallel group before next

**Output:** `✓ Step 3: Implemented [N] files - [X/Y] tasks complete`

### [Review Gate 3] Post-Implementation (skip if auto mode)
- Present implementation summary (files changed, key changes)
- Use `ask the user` to ask: "Proceed to testing?" / "Request implementation changes" / "Abort"
- **Auto mode:** Skip this gate

## Step 4: Testing (skip if no-test mode)

**All modes (except no-test):**
- Write tests: happy path, edge cases, errors
- Prefer `tester` subagent when the runtime exposes subagents. If unavailable, run the test step inline and state the fallback.
- If failures: prefer `debugger` subagent when available → fix → repeat.
- **Forbidden:** fake mocks, commented tests, changed assertions, or skipping the test quality gate.

**Output:** `✓ Step 4: Tests [X/X passed] - tester delegated` or `✓ Step 4: Tests [X/X passed] - ran inline (subagent unavailable)`

### [Review Gate 4] Post-Testing (skip if auto mode)
- Present test results summary
- Use `ask the user` to ask: "Proceed to code review?" / "Request test fixes" / "Abort"
- **Auto mode:** Skip this gate

## Step 5: Code Review

**All modes - review gate required:**
- Prefer `code_reviewer` subagent when the runtime exposes subagents.
- If unavailable, perform a code-review pass inline and state the fallback.

**Interactive/Parallel/Code/No-test:**
- Interactive cycle (max 3): see `review-cycle.md`
- Requires user approval

**Auto:**
- Auto-approve if score≥9.5 AND 0 critical
- Auto-fix critical (max 3 cycles)
- Escalate to user after 3 failed cycles

**Fast:**
- Simplified review, no fix loop
- User approves or aborts

**Output:** `✓ Step 5: Review [score]/10 - [Approved|Auto-approved] - code_reviewer delegated` or `✓ Step 5: Review [score]/10 - ran inline (subagent unavailable)`

## Step 6: Finalize

**All modes - finalize gate required:**
1. Prefer spawning these agents in parallel when the runtime exposes subagents:
   - `project_manager`: Run full sync-back for `[plan-path]`: reconcile completed tasks/checklists with all phase files, backfill stale completed checkboxes across every phase, then update plan.md frontmatter/table progress. Do NOT only mark current phase.
   - `docs_manager`: Update docs for changes.
2. Project-manager sync-back MUST include:
   - Sweep all `phase-XX-*.md` files in the plan directory.
   - Mark every completed item `[ ] → [x]` based on completed tasks (including earlier phases finished before current phase).
   - Update `plan.md` status/progress (`pending`/`in-progress`/`completed`) from actual checkbox state.
   - Return unresolved mappings if any completed task cannot be matched to a phase file.
3. Mark task records/checklists complete after sync-back confirmation.
4. Onboarding check (API keys, env vars)
5. Ask user before committing; prefer `git_manager` subagent when available.

**Runtime fallback:** If subagents are unavailable, run the finalize duties inline and state the fallback. Do not block completion solely because a subagent tool is unavailable.

**Auto mode:** Continue to next phase automatically, start from **Step 3**.
**Others:** Ask user before next phase

**Output:** `✓ Step 6: Finalized - delegated/inline - Full-plan sync-back completed`

## Mode-Specific Flow Summary

Legend: `[R]` = Review Gate (human approval required)

```
interactive: 0 → 1 → [R] → 2 → [R] → 3 → [R] → 4 → [R] → 5(user) → 6
auto:        0 → 1 → 2 → 3 → 4 → 5(auto) → 6 → next phase (NO stops)
fast:        0 → skip → 2(fast) → [R] → 3 → [R] → 4 → [R] → 5(simple) → 6
parallel:    0 → 1? → [R] → 2(parallel) → [R] → 3(multi-agent) → [R] → 4 → [R] → 5(user) → 6
no-test:     0 → 1 → [R] → 2 → [R] → 3 → [R] → skip → 5(user) → 6
code:        0 → skip → skip → 3 → [R] → 4 → [R] → 5(user) → 6
```

**Key difference:** `auto` mode is the ONLY mode that skips all review gates.

## Critical Rules

- Never skip steps without mode justification
- **DELEGATION-FIRST:** Steps 4, 5, 6 should use subagents when the runtime exposes them. `ck:cook` invocation authorizes this delegation.
  - Step 4: `tester` (and `debugger` if failures)
  - Step 5: `code_reviewer`
  - Step 6: `project_manager`, `docs_manager`, `git_manager`
- If subagents/task tools are unavailable, fallback inline and report the fallback without blocking.
- Use task tooling to create records for each unchecked item with priority order and dependencies when available.
- Use task tooling to mark records `in_progress` when picking up a task and `complete` after finalizing when available.
- All step outputs follow format: `✓ Step [N]: [status] - [metrics]`
- **VALIDATION:** Workflow is incomplete only if required quality gates (implementation, tests unless skipped, review, sync-back) are skipped; lack of subagent tool alone is not a failure.
