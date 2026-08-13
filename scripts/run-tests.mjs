#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const coreSuites = [
  ["statusline unit", [".codex/hooks/lib/__tests__/statusline.test.cjs"]],
  ["statusline integration", [".codex/hooks/lib/__tests__/statusline-integration.test.cjs"]],
  ["worktree", [".codex/scripts/worktree.test.cjs"]],
  ["installer", ["scripts/apply-codex-kit.test.mjs"]],
  ["markdown viewer", [".agents/skills/markdown-novel-viewer/scripts/tests/server.test.cjs"]],
];

const optionalSuites = [
  [
    "dashboard implementation",
    [".agents/skills/markdown-novel-viewer/tests/run-tests.cjs"],
    path.join(root, ".agents/skills/plans-kanban/node_modules/gray-matter"),
  ],
  [
    "dashboard XSS verification",
    [".agents/skills/markdown-novel-viewer/tests/verify-xss.cjs"],
    path.join(root, ".agents/skills/plans-kanban/node_modules/gray-matter"),
  ],
];

function runSuite(name, args) {
  console.log(`\n=== ${name} ===`);
  const result = spawnSync(process.execPath, args, {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  });
  if (result.error) {
    console.error(`${name} failed to start: ${result.error.message}`);
    return false;
  }
  return result.status === 0;
}

let failed = false;
for (const [name, args] of coreSuites) {
  if (!runSuite(name, args)) failed = true;
}

for (const [name, args, dependencyPath] of optionalSuites) {
  if (!fs.existsSync(dependencyPath)) {
    console.log(`\n=== ${name} (skipped) ===`);
    console.log(`Optional dependencies are not installed. Run:`);
    console.log(`  npm install --prefix .agents/skills/plans-kanban`);
    continue;
  }
  if (!runSuite(name, args)) failed = true;
}

if (failed) {
  console.error("\nTest suite failed.");
  process.exit(1);
}

console.log("\nAll supported test suites passed.");
