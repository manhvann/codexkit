#!/usr/bin/env node
/**
 * Development Rules Reminder - UserPromptSubmit Hook (Optimized)
 *
 * Injects context: session info, rules, modularization reminders, and Plan Context.
 * Static env info (Node, Python, OS) now comes from SessionStart env vars.
 *
 * Exit Codes:
 *   0 - Success (non-blocking, allows continuation)
 *
 * Core logic extracted to lib/context-builder.cjs for OpenCode plugin reuse.
 */

// Crash wrapper
try {
  const fs = require('fs');
  const path = require('path');

  // Import shared context building logic
  const {
    buildReminderContext,
    wasRecentlyInjected
  } = require('./lib/context-builder.cjs');
  const { isHookEnabled } = require('./lib/ck-config-utils.cjs');

  const KIT_TARGET_ROOT = path.resolve(__dirname, '..', '..');

  // Early exit if hook disabled in config
  if (!isHookEnabled('dev-rules-reminder', { cwd: KIT_TARGET_ROOT })) {
    process.exit(0);
  }

// ═══════════════════════════════════════════════════════════════════════════
// MAIN EXECUTION
// ═══════════════════════════════════════════════════════════════════════════

async function main() {
  try {
    const stdin = fs.readFileSync(0, 'utf-8').trim();
    if (!stdin) process.exit(0);

    const payload = JSON.parse(stdin);
    if (wasRecentlyInjected(payload.transcript_path)) process.exit(0);

    // Get session ID from hook input or env var
    const sessionId = payload.session_id || process.env.CK_SESSION_ID || null;

    // Resolve configuration against the selected ckit target, not a child repo
    // CWD. This keeps plans/docs/reports in the umbrella target while still
    // showing the agent's actual working directory in context.
    const workCwd = payload.cwd?.trim() || process.cwd();
    const baseDir = KIT_TARGET_ROOT;

    // Use shared context builder with baseDir for absolute paths
    const { content } = buildReminderContext({ sessionId, baseDir, staticEnv: { cwd: workCwd } });

    console.log(content);
    process.exit(0);
  } catch (error) {
    console.error(`Dev rules hook error: ${error.message}`);
    process.exit(0);
  }
  }

  main();
} catch (e) {
  // Minimal crash logging (zero deps — only Node builtins)
  try {
    const fs = require('fs');
    const p = require('path');
    const logDir = p.join(__dirname, '.logs');
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
    fs.appendFileSync(p.join(logDir, 'hook-log.jsonl'),
      JSON.stringify({ ts: new Date().toISOString(), hook: p.basename(__filename, '.cjs'), status: 'crash', error: e.message }) + '\n');
  } catch (_) {}
  process.exit(0); // fail-open
}
