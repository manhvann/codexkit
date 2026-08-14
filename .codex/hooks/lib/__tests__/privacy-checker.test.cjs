#!/usr/bin/env node

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {
  checkPrivacy,
  buildPromptData,
  grantPrivacyApproval,
  isPrivacySensitive,
} = require('../privacy-checker.cjs');

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'codexkit-privacy-test-'));
const projectRoot = path.join(tempRoot, 'project');
const approvalStorePath = path.join(tempRoot, 'approvals.json');
fs.mkdirSync(projectRoot, { recursive: true });

function check(toolName, filePath, options = {}) {
  return checkPrivacy({
    toolName,
    toolInput: { file_path: filePath },
    options: { cwd: projectRoot, approvalStorePath, ...options },
  });
}

try {
  const sensitivePaths = [
    '.env',
    '.env.local',
    '.env.production',
    'config/credentials.json',
    'deploy/secrets.yaml',
    'certs/server.pem',
    'certs/server.key',
    '.ssh/id_rsa',
    '.ssh/id_ed25519',
  ];

  for (const filePath of sensitivePaths) {
    assert.strictEqual(isPrivacySensitive(filePath), true, `${filePath} should be sensitive`);
    assert.strictEqual(check('Write', filePath).blocked, true, `${filePath} should start blocked`);
  }

  assert.strictEqual(isPrivacySensitive('.env.example'), false, '.env.example stays safe');
  assert.strictEqual(check('Write', '.env.example').blocked, false, '.env.example stays allowed');

  for (const toolName of ['Read', 'Write', 'Edit', 'MultiEdit']) {
    grantPrivacyApproval({
      filePath: '.env.local',
      toolName,
      cwd: projectRoot,
      approvalStorePath,
    });
    const approved = check(toolName, '.env.local');
    assert.strictEqual(approved.blocked, false, `${toolName} should consume its approval`);
    assert.strictEqual(approved.approvalSource, 'one-time');
    assert.strictEqual(check(toolName, '.env.local').blocked, true, `${toolName} approval must be one-time`);
  }

  grantPrivacyApproval({ filePath: '.env.local', toolName: 'Write', cwd: projectRoot, approvalStorePath });
  assert.strictEqual(check('Read', '.env.local').blocked, true, 'approval must be scoped to the tool');
  assert.strictEqual(check('Write', 'other/.env.local').blocked, true, 'approval must be scoped to the path');

  grantPrivacyApproval({ filePath: '.env.local', toolName: 'Write', cwd: projectRoot, approvalStorePath });
  const state = JSON.parse(fs.readFileSync(approvalStorePath, 'utf8'));
  for (const grant of state.grants) grant.expiresAt = Date.now() - 1;
  fs.writeFileSync(approvalStorePath, JSON.stringify(state));
  assert.strictEqual(check('Write', '.env.local').blocked, true, 'expired approvals must not be consumed');

  assert.throws(
    () => grantPrivacyApproval({ filePath: '../outside/.env.local', toolName: 'Write', cwd: projectRoot, approvalStorePath }),
    /inside the current project/,
  );

  const prompt = buildPromptData('.env.local', 'Write');
  assert.match(prompt.question.text, /write to/);
  assert.match(prompt.question.options[0].description, /once/);
  assert.strictEqual(prompt.tool, 'Write');

  console.log('Privacy checker tests: all passed');
} finally {
  fs.rmSync(tempRoot, { recursive: true, force: true });
}
