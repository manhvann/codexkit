#!/usr/bin/env node
/**
 * privacy-block.cjs - Block access to sensitive files unless user-approved
 *
 * PRIVACY-based blocking (separate from SIZE-based scout-block)
 * Blocks sensitive files. After user approval, grant a one-time approval with
 * privacy-approval.cjs and retry the original tool call with its real path.
 *
 * Flow:
 * 1. LLM tries: Read ".env" → BLOCKED
 * 2. LLM asks user for permission
 * 3. LLM grants one approval for the exact tool/path
 * 4. LLM retries the original tool call unchanged → ALLOWED once
 *
 * Core logic extracted to lib/privacy-checker.cjs for OpenCode plugin reuse.
 */

(async () => {
  try {
    const path = require('path');

    // Import shared privacy checking logic
    const {
      checkPrivacy,
      isSafeFile,
      isPrivacyBlockDisabled,
      isPrivacySensitive,
      hasApprovalPrefix,
      stripApprovalPrefix,
      extractPaths,
      isSuspiciousPath,
      buildPromptData
    } = require('./lib/privacy-checker.cjs');
    const { isHookEnabled } = require('./lib/ck-config-utils.cjs');

    // Early exit if hook disabled in config
    if (!isHookEnabled('privacy-block')) {
      process.exit(0);
    }

/**
 * Format block message with approval instructions and a JSON marker for the runtime/user prompt
 * @param {string} filePath - Blocked file path
 * @returns {string} Formatted block message with JSON marker
 */
function shellQuote(value) {
  return `'${String(value).replace(/'/g, `'\\''`)}'`;
}

function formatBlockMessage(filePath, toolName = 'Read') {
  const promptData = buildPromptData(filePath, toolName);
  const approvalCommand = `node .codex/hooks/privacy-approval.cjs approve --tool ${shellQuote(toolName)} --path ${shellQuote(filePath)}`;

  return `
\x1b[36mNOTE:\x1b[0m This is not an error - this block protects sensitive data.

\x1b[33mPRIVACY BLOCK\x1b[0m: Sensitive file access requires user approval

  \x1b[33mFile:\x1b[0m ${filePath}

  This file may contain secrets (API keys, passwords, tokens).

\x1b[90m@@PRIVACY_PROMPT_START@@\x1b[0m
${JSON.stringify(promptData, null, 2)}
\x1b[90m@@PRIVACY_PROMPT_END@@\x1b[0m

  \x1b[34mAssistant:\x1b[0m Ask the user for approval using the JSON above, then:
  \x1b[32mIf "Yes":\x1b[0m Run ${approvalCommand}, then retry the original ${toolName} call unchanged.
  \x1b[31mIf "No":\x1b[0m  Continue without this file.
`;
}

/**
 * Format approval notice
 * @param {string} filePath - Approved file path
 * @returns {string} Formatted approval notice
 */
function formatApprovalNotice(filePath) {
  return `\x1b[32m✓\x1b[0m Privacy: User-approved access to ${path.basename(filePath)}`;
}

// Main
async function main() {
  let input = '';
  for await (const chunk of process.stdin) {
    input += chunk;
  }

  let hookData;
  try {
    hookData = JSON.parse(input);
  } catch (e) {
    process.exit(0); // Invalid JSON, allow
  }

  const { tool_input: toolInput, tool_name: toolName } = hookData;

  // Use shared privacy checker
  const result = checkPrivacy({
    toolName,
    toolInput,
    options: { allowBash: true }
  });

  // Handle results
  if (result.approved) {
    // User approved - allow with notice
    if (result.suspicious) {
      console.error('\x1b[33mWARN:\x1b[0m Approved path is outside project:', result.filePath);
    }
    console.error(formatApprovalNotice(result.filePath));
    process.exit(0);
  }

  if (result.isBash) {
    // Bash: warn but don't block - allows "Yes → bash cat" flow
    console.error(`\x1b[33mWARN:\x1b[0m ${result.reason}`);
    process.exit(0);
  }

  if (result.blocked) {
    // No approval - block
    console.error(formatBlockMessage(result.filePath, toolName));
    process.exit(2);
  }

  process.exit(0); // Allow
}

    // Run main only when executed directly (not when required for testing)
    if (require.main === module) {
      main().catch(() => process.exit(0));
    }

    // Export functions for unit testing
    if (typeof module !== 'undefined') {
      module.exports = {
        isSafeFile,
        isPrivacyBlockDisabled,
        isPrivacySensitive,
        hasApprovalPrefix,
        stripApprovalPrefix,
        extractPaths,
      };
    }
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
})();
