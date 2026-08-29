#!/usr/bin/env node
/**
 * test-pattern-matcher.cjs - Unit tests for pattern-matcher module
 */

const path = require('path');
const { loadPatterns, createMatcher, matchPath, DEFAULT_PATTERNS } = require('../pattern-matcher.cjs');

const tests = [
  // === Basic blocking at root ===
  // node_modules, .git, dist are NOT blocked by default (SKI-11) — see
  // the dedicated ALL_PATTERNS assertions below for their matching logic.
  { path: 'build/output', expected: true, desc: 'root build' },
  { path: '__pycache__/file.pyc', expected: true, desc: 'root __pycache__' },

  // === Subfolder blocking (THE BUG FIX!) ===
  { path: 'apps/backend/build/server.js', expected: true, desc: 'subfolder build' },
  { path: 'packages/shared/__pycache__/module.pyc', expected: true, desc: 'subfolder __pycache__' },

  // === Not blocked by default (SKI-11) ===
  { path: 'node_modules/lodash', expected: false, desc: 'root node_modules NOT blocked by default' },
  { path: 'node_modules', expected: false, desc: 'root node_modules bare NOT blocked by default' },
  { path: '.git/objects', expected: false, desc: 'root .git NOT blocked by default' },
  { path: 'dist/bundle.js', expected: false, desc: 'root dist NOT blocked by default' },
  { path: 'packages/web/node_modules/react', expected: false, desc: 'subfolder node_modules NOT blocked by default' },
  { path: 'apps/api/node_modules', expected: false, desc: 'subfolder node_modules bare NOT blocked by default' },
  { path: 'packages/.git/HEAD', expected: false, desc: 'subfolder .git NOT blocked by default' },
  { path: 'packages/web/dist/index.js', expected: false, desc: 'subfolder dist NOT blocked by default' },
  { path: 'a/b/c/d/node_modules/e', expected: false, desc: 'deep nested node_modules NOT blocked by default' },
  { path: 'projects/monorepo/packages/web/node_modules/react/index.js', expected: false, desc: 'very deep nested node_modules NOT blocked by default' },

  // === Allowed paths ===
  { path: 'src/index.js', expected: false, desc: 'src directory' },
  { path: 'packages/web/src/App.tsx', expected: false, desc: 'nested src' },
  { path: 'lib/utils.js', expected: false, desc: 'lib directory' },
  { path: 'README.md', expected: false, desc: 'root file' },
  { path: 'apps/api/server.ts', expected: false, desc: 'nested app file' },

  // === Edge cases (should NOT be blocked) ===
  { path: 'my-node_modules-project/file.js', expected: false, desc: 'node_modules in project name' },
  { path: 'build-tools/script.sh', expected: false, desc: 'build- prefix in name' },
  { path: 'src/dist-utils.js', expected: false, desc: 'dist- prefix in name' },
  { path: 'nodemodulesbackup/file.js', expected: false, desc: 'node_modules without separator' },
  { path: 'distro/file.js', expected: false, desc: 'dist prefix without separator' },
];

// === Opt-in patterns (project adds these to .ckignore) still match correctly ===
const optInMatcher = createMatcher(['node_modules', '.git', 'dist', '.next']);
const optInTests = [
  { path: 'node_modules/lodash', expected: true, desc: '[opt-in] root node_modules' },
  { path: 'packages/web/node_modules/react', expected: true, desc: '[opt-in] subfolder node_modules' },
  { path: '.git/objects', expected: true, desc: '[opt-in] root .git' },
  { path: 'packages/.git/HEAD', expected: true, desc: '[opt-in] subfolder .git' },
  { path: 'dist/bundle.js', expected: true, desc: '[opt-in] root dist' },
  { path: 'packages/web/dist/index.js', expected: true, desc: '[opt-in] subfolder dist' },
  { path: 'apps/web/.next/cache', expected: true, desc: '[opt-in] subfolder .next' },
  { path: 'src/index.js', expected: false, desc: '[opt-in] unrelated file still allowed' },
];

console.log('Testing pattern-matcher module...\n');

const matcher = createMatcher(DEFAULT_PATTERNS);
let passed = 0;
let failed = 0;

for (const test of tests) {
  const result = matchPath(matcher, test.path);
  const success = result.blocked === test.expected;
  if (success) {
    console.log(`\x1b[32m✓\x1b[0m ${test.desc}: ${test.path} -> ${result.blocked ? 'BLOCKED' : 'ALLOWED'}`);
    passed++;
  } else {
    console.log(`\x1b[31m✗\x1b[0m ${test.desc}: expected ${test.expected ? 'BLOCKED' : 'ALLOWED'}, got ${result.blocked ? 'BLOCKED' : 'ALLOWED'}`);
    failed++;
  }
}

for (const test of optInTests) {
  const result = matchPath(optInMatcher, test.path);
  const success = result.blocked === test.expected;
  if (success) {
    console.log(`\x1b[32m✓\x1b[0m ${test.desc}: ${test.path} -> ${result.blocked ? 'BLOCKED' : 'ALLOWED'}`);
    passed++;
  } else {
    console.log(`\x1b[31m✗\x1b[0m ${test.desc}: expected ${test.expected ? 'BLOCKED' : 'ALLOWED'}, got ${result.blocked ? 'BLOCKED' : 'ALLOWED'}`);
    failed++;
  }
}

console.log(`\nResults: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
