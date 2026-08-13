# UI Fix Workflow

For fixing visual/UI issues. Requires design skills. Uses runtime task tracking for phase tracking.

## Required Skills (activate in order)
1. `ck:ui-ux-pro-max` - Design database (ALWAYS FIRST)
2. `ck:ui-ux-pro-max` - Design principles
3. `ck:frontend-design` - Implementation patterns

## Pre-fix Research
```bash
python3 .agents/skills/ui-ux-pro-max/scripts/search.py "<product-type>" --domain product
python3 .agents/skills/ui-ux-pro-max/scripts/search.py "<style>" --domain style
python3 .agents/skills/ui-ux-pro-max/scripts/search.py "accessibility" --domain ux
```

## Task Setup (Before Starting)

```
T1 = task creation(subject="Analyze visual issue",    activeForm="Analyzing visual issue")
T2 = task creation(subject="Implement UI fix",         activeForm="Implementing UI fix",       addBlockedBy=[T1])
T3 = task creation(subject="Verify visually",          activeForm="Verifying visually",         addBlockedBy=[T2])
T4 = task creation(subject="DevTools check",           activeForm="Checking with DevTools",     addBlockedBy=[T3])
T5 = task creation(subject="Test compilation",         activeForm="Testing compilation",        addBlockedBy=[T4])
T6 = task creation(subject="Update design docs",       activeForm="Updating design docs",       addBlockedBy=[T5])
```

## Workflow

### Step 1: Analyze
`task update(T1, status="in_progress")`
Analyze screenshots/videos with `ck:ai-multimodal` skill.

- Read the configured `Docs:` path `design-guidelines.md` first
- Identify exact visual discrepancy

`task update(T1, status="completed")`

### Step 2: Implement
`task update(T2, status="in_progress")`
Use `ui_ux_designer` agent.

`task update(T2, status="completed")`

### Step 3: Verify Visually
`task update(T3, status="in_progress")`
Screenshot + `ck:ai-multimodal` analysis.

- Capture parent container, not whole page
- Compare to design guidelines
- If incorrect → keep T3 `in_progress`, loop back to Step 2

`task update(T3, status="completed")`

### Step 4: DevTools Check
`task update(T4, status="in_progress")`
Use `ck:chrome-devtools` skill.

`task update(T4, status="completed")`

### Step 5: Test
`task update(T5, status="in_progress")`
Use `tester` agent for compilation check.

`task update(T5, status="completed")`

### Step 6: Document
`task update(T6, status="in_progress")`
Update the configured `Docs:` path `design-guidelines.md` if needed.

`task update(T6, status="completed")`

## Tips
- Use `ck:ai-multimodal` for generating visual assets
- Use `ImageMagick` for image editing
