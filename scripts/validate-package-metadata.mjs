#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const packagePath = path.join(root, "package.json");
const readmePath = path.join(root, "README.md");
const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));
const readme = fs.readFileSync(readmePath, "utf8");
const failures = [];

const repositoryUrl = typeof packageJson.repository === "object"
  ? packageJson.repository.url
  : packageJson.repository;
if (!repositoryUrl || !packageJson.homepage || !packageJson.bugs?.url) {
  failures.push("package.json must define repository, homepage, and bugs URLs");
}

const packageFiles = new Set(packageJson.files || []);
const markdownLinks = [...readme.matchAll(/\]\(([^)#?\s]+)(?:[#?][^)]*)?\)/g)]
  .map((match) => match[1])
  .filter((link) => !/^[a-z][a-z0-9+.-]*:/i.test(link) && !link.startsWith("/"));

for (const link of markdownLinks) {
  const normalized = path.normalize(link);
  if (!fs.existsSync(path.join(root, normalized))) {
    failures.push(`README link target is missing: ${link}`);
  }
  if (!packageFiles.has(normalized)) {
    failures.push(`README link target is not included in package files: ${link}`);
  }
}

if (failures.length > 0) {
  console.error("Package metadata validation failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Package metadata OK (${markdownLinks.length} README links checked)`);
