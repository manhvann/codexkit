#!/usr/bin/env node
/**
 * SubagentStart Hook - Injects context to subagents (Optimized)
 *
 * Fires: When a subagent (Task tool call) is started
 * Purpose: Inject minimal context using env vars from SessionStart
 * Target: ~200 tokens (down from ~350)
 *
 * Exit Codes:
 *   0 - Success (non-blocking, allows continuation)
 */

// Crash wrapper
try {
  const fs = require('fs');
  const path = require('path');
  const {
    loadConfig,
    resolveNamingPattern,
    getGitBranch,
    getGitRoot,
    resolvePlanPath,
    getReportsPath,
    normalizePath,
    extractTaskListId,
    isHookEnabled,
    resolveConfiguredPath
  } = require('./lib/ck-config-utils.cjs');
  const { resolveSkillsVenv } = require('./lib/context-builder.cjs');

  const KIT_TARGET_ROOT = path.resolve(__dirname, '..', '..');

  // Early exit if hook disabled in config
  if (!isHookEnabled('subagent-init', { cwd: KIT_TARGET_ROOT })) {
    process.exit(0);
  }

/**
 * Get agent-specific context from config
 */
function getAgentContext(agentType, config) {
  const agentConfig = config.subagent?.agents?.[agentType];
  if (!agentConfig?.contextPrefix) return null;
  return agentConfig.contextPrefix;
}

/**
 * Build trust verification section if enabled
 */
function buildTrustVerification(config) {
  if (!config.trust?.enabled || !config.trust?.passphrase) return [];
  return [
    ``,
    `## Trust Verification`,
    `Passphrase: "${config.trust.passphrase}"`
  ];
}

/**
 * Main hook execution
 */
async function main() {
  try {
    const stdin = fs.readFileSync(0, 'utf-8').trim();
    if (!stdin) process.exit(0);

    const payload = JSON.parse(stdin);
    const agentType = payload.agent_type || 'unknown';
    const agentId = payload.agent_id || 'unknown';

    // Use payload.cwd as the working directory, but resolve ckit config and
    // plan/doc/report paths against the selected kit target. This prevents
    // subagents working inside child repos from creating plans in those repos.
    // Issue #327: Use trim() to handle empty string edge case
    const effectiveCwd = payload.cwd?.trim() || process.cwd();
    const kitTargetRoot = KIT_TARGET_ROOT;

    // Load config from the selected ckit target root, not the child repo CWD.
    const config = loadConfig({ includeProject: false, includeAssertions: false, cwd: kitTargetRoot });

    // Compute naming pattern directly (don't rely on env vars which may not propagate)
    // Pass effectiveCwd to git commands to support monorepo/submodule scenarios
    const gitBranch = getGitBranch(effectiveCwd);
    const gitRoot = getGitRoot(effectiveCwd);
    // Git root is kept for reference, but the kit target determines where
    // plans/docs/reports are created.
    const baseDir = kitTargetRoot;

    // Debug logging for path resolution troubleshooting
    if (process.env.CK_DEBUG) {
      console.error(`[subagent-init] effectiveCwd=${effectiveCwd}, gitRoot=${gitRoot}, kitTargetRoot=${kitTargetRoot}, baseDir=${baseDir}`);
    }
    const namePattern = resolveNamingPattern(config.plan, gitBranch);

    // Resolve plan and reports path - use absolute paths based on CWD (Issue #327)
    // Use session_id from payload to resolve active plan context (Issue #321)
    const sessionId = payload.session_id || process.env.CK_SESSION_ID || null;
    const resolved = resolvePlanPath(sessionId, config, { cwd: kitTargetRoot });
    const reportsPath = getReportsPath(resolved.path, resolved.resolvedBy, config.plan, config.paths, baseDir);
    const activePlan = resolved.resolvedBy === 'session' ? resolved.path : '';
    const suggestedPlan = resolved.resolvedBy === 'branch' ? resolved.path : '';

    // Extract task list ID for Codex Tasks coordination (shared helper, DRY)
    const taskListId = extractTaskListId(resolved);
    const plansPath = resolveConfiguredPath(baseDir, config.paths?.plans, 'plans');
    const docsPath = resolveConfiguredPath(baseDir, config.paths?.docs, 'docs');
    const thinkingLanguage = config.locale?.thinkingLanguage || '';
    const responseLanguage = config.locale?.responseLanguage || '';
    // Auto-default thinkingLanguage to 'en' when only responseLanguage is set
    const effectiveThinking = thinkingLanguage || (responseLanguage ? 'en' : '');

    // Build compact context (~200 tokens)
    const lines = [];

    // Subagent identification
    lines.push(`## Subagent: ${agentType}`);
    lines.push(`ID: ${agentId} | CWD: ${effectiveCwd}`);
    lines.push(`Kit Target: ${kitTargetRoot}`);
    lines.push(``);

    // Plan context (from env vars)
    lines.push(`## Context`);
    if (activePlan) {
      lines.push(`- Plan: ${activePlan}`);
      if (taskListId) {
        lines.push(`- Task List: ${taskListId} (shared with session)`);
      }
    } else if (suggestedPlan) {
      lines.push(`- Plan: none | Suggested: ${suggestedPlan}`);
    } else {
      lines.push(`- Plan: none`);
    }
    lines.push(`- Reports: ${reportsPath}`);
    lines.push(`- Paths: ${plansPath}/ | ${docsPath}/`);
    lines.push(``);

    // Language (thinking + response, if configured)
    const hasThinking = effectiveThinking && effectiveThinking !== responseLanguage;
    if (hasThinking || responseLanguage) {
      lines.push(`## Language`);
      if (hasThinking) {
        lines.push(`- Thinking: Use ${effectiveThinking} for reasoning (logic, precision).`);
      }
      if (responseLanguage) {
        lines.push(`- Response: Respond in ${responseLanguage} (natural, fluent).`);
      }
      lines.push(``);
    }

    // Resolve Python venv path for subagent instructions
    const skillsVenv = resolveSkillsVenv('.codex', kitTargetRoot, config.python?.runner);

    // Core rules (minimal)
    lines.push(`## Rules`);
    lines.push(`- Reports → ${reportsPath}`);
    lines.push(`- YAGNI / KISS / DRY`);
    lines.push(`- Concise, list unresolved Qs at end`);
    // Python venv rules (if venv exists)
    if (skillsVenv) {
      lines.push(`- Python scripts in ckit: Use \`${skillsVenv}\`; do not call bare \`python\` or system \`python3\` unless this interpreter is unavailable.`);
      lines.push(`- Never use global pip install`);
    }

    // Naming templates (computed directly for reliable injection)
    lines.push(``);
    lines.push(`## Naming`);
    lines.push(`- Report: ${path.join(reportsPath, `${agentType}-${namePattern}.md`)}`);
    lines.push(`- Plan dir: ${path.join(plansPath, namePattern)}/`);

    // Trust verification (if enabled)
    lines.push(...buildTrustVerification(config));

    // Agent-specific context (if configured)
    const agentContext = getAgentContext(agentType, config);
    if (agentContext) {
      lines.push(``);
      lines.push(`## Agent Instructions`);
      lines.push(agentContext);
    }

    // CRITICAL: SubagentStart requires hookSpecificOutput.additionalContext format
    const output = {
      hookSpecificOutput: {
        hookEventName: "SubagentStart",
        additionalContext: lines.join('\n')
      }
    };

    console.log(JSON.stringify(output));
    process.exit(0);
  } catch (error) {
    console.error(`SubagentStart hook error: ${error.message}`);
    process.exit(0); // Fail-open
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
