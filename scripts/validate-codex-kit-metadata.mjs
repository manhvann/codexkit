#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const roots = process.argv.slice(2).map((root) => path.resolve(root));
if (roots.length === 0) roots.push(path.resolve(path.dirname(new URL(import.meta.url).pathname), ".."));

const SKIP_DIRS = new Set([".git", "node_modules", ".venv", "venv", "dist", "build", "target", "__pycache__"]);

function walk(dir, predicate, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(entry.name)) continue;
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(fullPath, predicate, out);
    else if (predicate(fullPath)) out.push(fullPath);
  }
  return out;
}

function readFrontmatter(filePath) {
  const content = fs.readFileSync(filePath, "utf8").replace(/^\uFEFF/, "").replace(/\r\n/g, "\n");
  if (!content.startsWith("---\n")) return null;
  const end = content.indexOf("\n---", 4);
  if (end === -1) return null;
  const result = {};
  for (const line of content.slice(4, end).trim().split("\n")) {
    const match = line.match(/^([A-Za-z0-9_-]+):\s*(.*)$/);
    if (match) result[match[1]] = match[2].replace(/^["']|["']$/g, "").trim();
  }
  return result;
}

let failures = 0;

for (const root of roots) {
  const agentFiles = walk(
    root,
    (filePath) => filePath.includes(`${path.sep}.codex${path.sep}agents${path.sep}`) && filePath.endsWith(".toml"),
  );
  const skillFiles = walk(
    root,
    (filePath) => filePath.includes(`${path.sep}.agents${path.sep}skills${path.sep}`) && path.basename(filePath) === "SKILL.md",
  );

  for (const filePath of agentFiles) {
    const content = fs.readFileSync(filePath, "utf8");
    const name = content.match(/^name\s*=\s*"([^"]+)"/m)?.[1]?.trim();
    const description = content.match(/^description\s*=\s*"([^"]+)"/m)?.[1]?.trim();
    const instructions = content.match(/^developer_instructions\s*=\s*"""([\s\S]*?)"""/m)?.[1]?.trim();
    if (!name || !description || !instructions) {
      failures += 1;
      console.error(`Malformed agent: ${path.relative(root, filePath)}`);
      if (!name) console.error("  - missing non-empty name");
      if (!description) console.error("  - missing non-empty description");
      if (!instructions) console.error("  - missing developer_instructions");
    }
  }

  for (const filePath of skillFiles) {
    const frontmatter = readFrontmatter(filePath);
    if (!frontmatter?.name || !frontmatter?.description) {
      failures += 1;
      console.error(`Malformed skill: ${path.relative(root, filePath)}`);
      if (!frontmatter) console.error("  - missing YAML frontmatter");
      if (frontmatter && !frontmatter.name) console.error("  - missing non-empty name");
      if (frontmatter && !frontmatter.description) console.error("  - missing non-empty description");
    }
  }
}

if (failures > 0) {
  console.error(`\nMetadata validation failed: ${failures} issue(s).`);
  process.exit(1);
}

console.log("Codex kit metadata OK");
