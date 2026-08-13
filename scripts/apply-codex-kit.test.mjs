#!/usr/bin/env node

import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const target = await fs.mkdtemp(path.join(os.tmpdir(), "codexkit-installer-test-"));

try {
  const result = spawnSync(
    process.execPath,
    [
      path.join(root, "scripts", "apply-codex-kit.mjs"),
      "--target",
      target,
      "--profile",
      "minimal",
      "--skip-agents-md",
      "--yes",
    ],
    { cwd: root, encoding: "utf8" },
  );

  assert.equal(result.status, 0, `installer failed:\n${result.stdout}\n${result.stderr}`);

  const source = await fs.readFile(path.join(root, ".codex", "statusline.cjs"), "utf8");
  const installedPath = path.join(target, ".codex", "statusline.cjs");
  const installed = await fs.readFile(installedPath, "utf8");
  assert.equal(installed, source, "installer should copy the bundled statusline entrypoint");

  console.log("✓ installer copies .codex/statusline.cjs");
} finally {
  await fs.rm(target, { recursive: true, force: true });
}
