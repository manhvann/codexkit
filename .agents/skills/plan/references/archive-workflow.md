# Archive Workflow

## Your mission
Read and analyze the plans, then write journal entries and archive specific plans or all plans in the `plans` directory.

## Plan Resolution
1. If `$ARGUMENTS` provided → Use that path
2. Else read all plans in the `plans` directory

## Workflow

### Step 1: Read Plan Files

Read the plan directory:
- `plan.md` - Overview and phases list
- `phase-*.md` - 20 first lines of each phase file to understand the progress and status

### Step 2: Summarize the plans and document them with `$ck:journal` skill command
Use `ask the user` tool to ask if user wants to document journal entries or not.
Skip this step if user selects "No".
If user selects "Yes":
- Analyze the information in previous steps.
- Use Task tool with `agent type="journal_writer"` in parallel to document all plans.
- Journal entries should be concise and focused on the most important events, key changes, impacts, and decisions.
- Keep journal entries in the the configured `Docs:` path `journals/` directory.

### Step 3: Ask user to confirm the action before archiving these plans
Use `ask the user` tool to ask if user wants to proceed with archiving these plans, select specific plans to archive or all completed plans only.
Use `ask the user` tool to ask if user wants to delete permanently or move to the the configured `Plans:` path `archive/` directory.

### Step 4: Archive the plans
Start archiving the plans based on the user's choice:
- Move the plans to the the configured `Plans:` path `archive/` directory.
- Delete the plans permanently: `rm -rf <configured-plans>/<plan-1> <configured-plans>/<plan-2> ...`

### Step 5: Ask if user wants to commit the changes
Use `ask the user` tool to ask if user wants to commit the changes with these options:
- Stage and commit the changes (Use `$ck:git cm` skill command)
- Commit and push the changes (Use `$ck:git cp` skill command)
- Nah, I'll do it later

## Output
After archiving the plans, provide summary:
- Number of plans archived
- Number of plans deleted permanently
- Table of plans that are archived or deleted (title, status, created date, LOC)
- Table of journal entries that are created (title, status, created date, LOC)

## Important Notes
- Only ask questions about genuine decision points
- Sacrifice grammar for concision
- List any unresolved questions at the end
- Ensure token efficiency while maintaining high quality
