#!/usr/bin/env node
/**
 * Update session state with new active plan
 *
 * Usage: node .codex/scripts/set-active-plan.cjs [--project] <plan-path>
 *
 * This script updates the session temp file with the new active plan path,
 * allowing subagents to receive the latest plan context via SubagentStart hook.
 *
 * The session temp file (/tmp/ck-session-{id}.json) is the source of truth
 * for plan context within a session. Env vars ($CK_ACTIVE_PLAN) are just
 * the initial snapshot from session start.
 */

const path = require('path');
const fs = require('fs');
const { writeSessionState, readSessionState } = require('../hooks/lib/ck-config-utils.cjs');

const sessionId = process.env.CK_SESSION_ID;
const args = process.argv.slice(2);
let cwd = process.env.CK_PROJECT_ROOT || process.cwd();
const cwdIndex = args.indexOf('--cwd');
if (cwdIndex >= 0) {
  cwd = path.resolve(args[cwdIndex + 1] || cwd);
  args.splice(cwdIndex, 2);
}
const projectIndex = args.indexOf('--project');
const projectMode = projectIndex >= 0;
if (projectIndex >= 0) args.splice(projectIndex, 1);

const clearIndex = args.indexOf('--clear');
const clearMode = clearIndex >= 0;
if (clearIndex >= 0) args.splice(clearIndex, 1);

const newPlan = args[0];

if (!newPlan && !clearMode) {
  console.error('Error: Plan path required');
  console.log('Usage: node .codex/scripts/set-active-plan.cjs [--project] <plan-path>');
  console.log('Clear session plan: node .codex/scripts/set-active-plan.cjs --clear');
  console.log('Clear project plan: node .codex/scripts/set-active-plan.cjs --project --clear');
  console.log('Example: node .codex/scripts/set-active-plan.cjs plans/251207-1030-feature-name');
  process.exit(1);
}

function resolvePlanInput(input) {
  if (path.isAbsolute(input)) return path.resolve(input);
  const plansRoot = process.env.CK_PLANS_PATH ? path.resolve(process.env.CK_PLANS_PATH) : null;
  if (!plansRoot) return path.resolve(cwd, input);

  const normalized = input.replace(/\\/g, '/').replace(/^\.\/+/, '');
  const plansBase = path.basename(plansRoot);
  if (normalized === plansBase || normalized.startsWith(`${plansBase}/`)) {
    return path.resolve(path.dirname(plansRoot), input);
  }
  return path.resolve(plansRoot, input);
}

const stateDir = path.join(cwd, '.codex', 'state');
const statePath = path.join(stateDir, 'active-plan.json');

if (clearMode) {
  if (projectMode || !sessionId) {
    try {
      if (fs.existsSync(statePath)) fs.unlinkSync(statePath);
      console.log(`Project active plan cleared: ${statePath}`);
      process.exit(0);
    } catch (error) {
      console.error(`Failed to clear project active plan state: ${error.message}`);
      process.exit(1);
    }
  }

  const current = readSessionState(sessionId) || {};
  const success = writeSessionState(sessionId, {
    ...current,
    activePlan: null,
    timestamp: Date.now()
  });
  if (success) {
    console.log('Session active plan cleared');
    process.exit(0);
  }
  console.error('Failed to clear session state');
  process.exit(1);
}

const absolutePlan = resolvePlanInput(newPlan);

if (projectMode) {
  try {
    fs.mkdirSync(stateDir, { recursive: true });
    fs.writeFileSync(statePath, `${JSON.stringify({
      activePlan: absolutePlan,
      sessionOrigin: cwd,
      timestamp: Date.now(),
      source: 'project-state'
    }, null, 2)}\n`);
    console.log(`Active plan set in project state: ${absolutePlan}`);
    console.log(`State file: ${statePath}`);
    process.exit(0);
  } catch (error) {
    console.error(`Failed to write project active plan state: ${error.message}`);
    process.exit(1);
  }
}

if (!sessionId) {
  console.error('Warning: CK_SESSION_ID not set - session state will not persist');
  console.log(`Would set active plan to: ${absolutePlan}`);
  console.log('To persist for every session in this project, rerun with --project.');
  process.exit(0);
}

const current = readSessionState(sessionId) || {};
const success = writeSessionState(sessionId, {
  ...current,
  activePlan: absolutePlan,
  timestamp: Date.now()
});

if (success) {
  console.log(`Active plan set to: ${absolutePlan}`);
} else {
  console.error('Failed to update session state');
  process.exit(1);
}
