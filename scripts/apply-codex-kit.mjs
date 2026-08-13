#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import readline from "node:readline";
import readlinePromises from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const SCRIPT_PATH = fileURLToPath(import.meta.url);
const KIT_ROOT = path.resolve(path.dirname(SCRIPT_PATH), "..");

const MANAGED = {
  agents: ["# --- codex-kit-managed-agents-start ---", "# --- codex-kit-managed-agents-end ---"],
  features: ["# --- codex-kit-managed-features-start ---", "# --- codex-kit-managed-features-end ---"],
  agentsMd: ["<!-- codex-kit-managed-start -->", "<!-- codex-kit-managed-end -->"],
};

const SKIP_DIRS = new Set([
  ".git",
  ".hg",
  ".svn",
  ".codex",
  ".agents",
  ".cursor",
  ".vscode",
  ".idea",
  "node_modules",
  ".next",
  ".nuxt",
  ".svelte-kit",
  "dist",
  "build",
  "coverage",
  ".turbo",
  ".cache",
  "target",
  ".venv",
  "venv",
  "__pycache__",
]);

const PROJECT_MARKERS = [
  ".git",
  "package.json",
  "pyproject.toml",
  "requirements.txt",
  "go.mod",
  "Cargo.toml",
  "pom.xml",
  "build.gradle",
  "build.gradle.kts",
  "pubspec.yaml",
  "composer.json",
  "Gemfile",
  "mix.exs",
  "deno.json",
  "bun.lockb",
];

const CORE_SKILLS = [
  "ask",
  "brainstorm",
  "plan",
  "cook",
  "research",
  "scout",
  "code-review",
  "test",
  "debug",
  "fix",
  "git",
  "docs",
  "problem-solving",
  "context-engineering",
];

const CORE_AGENTS = [
  "brainstormer",
  "planner",
  "researcher",
  "code_reviewer",
  "tester",
  "debugger",
  "git_manager",
  "docs_manager",
];

const DEFAULT_HOOKS = [
  "session-init",
  "subagent-init",
  "dev-rules-reminder",
  "privacy-block",
  "scout-block",
  "cook-after-plan-reminder",
  "post-edit-simplify-reminder",
  "descriptive-name",
];

const HOOK_ALIASES = new Map([
  ["session", "session-init"],
  ["session-init", "session-init"],
  ["subagent", "subagent-init"],
  ["subagent-init", "subagent-init"],
  ["rules", "dev-rules-reminder"],
  ["dev-rules", "dev-rules-reminder"],
  ["dev-rules-reminder", "dev-rules-reminder"],
  ["privacy", "privacy-block"],
  ["privacy-block", "privacy-block"],
  ["scout", "scout-block"],
  ["scout-block", "scout-block"],
  ["cook", "cook-after-plan-reminder"],
  ["cook-after-plan-reminder", "cook-after-plan-reminder"],
  ["simplify", "post-edit-simplify-reminder"],
  ["post-edit", "post-edit-simplify-reminder"],
  ["post-edit-simplify-reminder", "post-edit-simplify-reminder"],
  ["descriptive", "descriptive-name"],
  ["descriptive-name", "descriptive-name"],
]);

const DETECTION_RULES = [
  {
    id: "frontend",
    skills: ["frontend-development", "frontend-design", "ui-styling", "web-design-guidelines", "web-testing", "preview"],
    agents: ["ui_ux_designer", "fullstack_developer"],
  },
  {
    id: "react",
    skills: ["react-best-practices"],
    agents: ["ui_ux_designer"],
  },
  {
    id: "tanstack",
    skills: ["tanstack"],
    agents: [],
  },
  {
    id: "backend",
    skills: ["backend-development", "databases"],
    agents: ["fullstack_developer"],
  },
  {
    id: "auth",
    skills: ["better-auth"],
    agents: ["code_reviewer"],
  },
  {
    id: "database",
    skills: ["databases"],
    agents: ["debugger"],
  },
  {
    id: "devops",
    skills: ["devops"],
    agents: ["debugger"],
  },
  {
    id: "documentation",
    skills: ["docs", "mermaidjs-v11", "mintlify"],
    agents: ["docs_manager"],
  },
  {
    id: "documents",
    skills: ["docx", "pdf", "pptx", "xlsx"],
    agents: ["docs_manager"],
  },
  {
    id: "mobile",
    skills: ["mobile-development"],
    agents: ["tester"],
  },
  {
    id: "payments",
    skills: ["payment-integration"],
    agents: ["code_reviewer"],
  },
  {
    id: "shopify",
    skills: ["shopify"],
    agents: ["researcher"],
  },
  {
    id: "threejs",
    skills: ["threejs", "shader"],
    agents: ["ui_ux_designer"],
  },
  {
    id: "remotion",
    skills: ["remotion", "media-processing"],
    agents: ["ui_ux_designer"],
  },
  {
    id: "ai",
    skills: ["ai-multimodal", "ai-artist", "gkg"],
    agents: ["researcher"],
  },
  {
    id: "mcp",
    skills: ["mcp-management", "mcp-builder", "use-mcp"],
    agents: ["mcp_manager"],
  },
];

function usage() {
  return `Apply the migrated Codex kit to any project.

Usage:
  ckit
  ckit --target <project> [options]
  ckit --projects-root <folder> --all-projects [options]

Profiles:
  --profile default       Install core kit + project recommendations (default)
  --profile minimal       Install only core skills/agents and privacy hook
  --profile all           Install every migrated skill, agent, and hook
  --profile custom        Install only --skills/--agents/--hooks selections

Options:
  --target <path>         Project to install into
  --projects-root <path>  Folder containing many project repositories
  --all-projects          Apply to every detected child project under --projects-root
  --project-depth <n>     Max depth for project discovery (default: 2)
  --include-root          Include --projects-root itself when it is a project
  --dry-run               Show actions without writing files
  --suggest-only          Analyze project and print recommendations only
  --repair-hook-wrappers  Refresh existing .codex hook compatibility wrappers only
  --details               Show selected skill/agent/hook names in output
  --interactive           Open an arrow-key selector for Target / Skills / Agents / Hooks (default for single target)
  --skills <list>         Comma-separated skills, or "all"/"none"
  --agents <list>         Comma-separated agents, or "all"/"none"
  --hooks <list>          Comma-separated hooks, or "all"/"none"
  --python <path|auto>    Python interpreter for ckit scripts (default: auto-detect)
  --with-recommended      Add recommendations to custom selections
  --force                 Overwrite existing selected files/directories
  --yes                   Skip selector/confirmation and apply immediately
  --list                  List available skills, agents, and hooks
  --verbose               Print per-file actions in batch mode
  --config <file>         Load JSON config with the same option names

Examples:
  cd ~/projects && ckit
  cd ~/projects && ckit --target . --dry-run --details
  cd ~/projects && ckit --target .
  cd ~/projects && ckit --target . --profile default --yes
  ckit --target ../my-app --dry-run
  ckit --target ../my-app --repair-hook-wrappers
  cd ~/projects && ckit --all-projects --dry-run
  cd ~/projects && ckit --all-projects --dry-run --details
  cd ~/projects && ckit --all-projects --profile default --yes
  ckit --target ../api --profile minimal --yes
  ckit --target ../web --profile custom --with-recommended --skills react-best-practices,tanstack --agents planner,tester --hooks privacy,scout --yes
`;
}

function parseArgs(argv) {
  const args = {
    profile: "default",
    dryRun: false,
    suggestOnly: false,
    allProjects: false,
    includeRoot: false,
    interactive: false,
    details: false,
    force: false,
    yes: false,
    list: false,
    verbose: false,
    withRecommended: false,
    skipAgentsMd: false,
    repairHookWrappers: false,
    projectDepth: 2,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    const next = () => {
      index += 1;
      if (index >= argv.length) throw new Error(`Missing value for ${arg}`);
      return argv[index];
    };

    if (arg === "--help" || arg === "-h") args.help = true;
    else if (arg === "--target" || arg === "-t") args.target = next();
    else if (arg === "--projects-root") args.projectsRoot = next();
    else if (arg === "--project-depth") args.projectDepth = Number.parseInt(next(), 10);
    else if (arg === "--profile" || arg === "-p") args.profile = next();
    else if (arg === "--skills") args.skills = next();
    else if (arg === "--agents") args.agents = next();
    else if (arg === "--hooks") args.hooks = next();
    else if (arg === "--python") args.python = next();
    else if (arg === "--config") args.config = next();
    else if (arg === "--dry-run") args.dryRun = true;
    else if (arg === "--suggest-only") args.suggestOnly = true;
    else if (arg === "--repair-hook-wrappers") args.repairHookWrappers = true;
    else if (arg === "--all-projects") args.allProjects = true;
    else if (arg === "--include-root") args.includeRoot = true;
    else if (arg === "--interactive") args.interactive = true;
    else if (arg === "--details") args.details = true;
    else if (arg === "--with-recommended") args.withRecommended = true;
    else if (arg === "--force") args.force = true;
    else if (arg === "--yes" || arg === "-y") args.yes = true;
    else if (arg === "--list") args.list = true;
    else if (arg === "--verbose") args.verbose = true;
    else if (arg === "--skip-agents-md") args.skipAgentsMd = true;
    else throw new Error(`Unknown option: ${arg}`);
  }

  return args;
}

async function loadConfig(args) {
  if (!args.config) return args;
  const configPath = path.resolve(args.config);
  const raw = await fs.readFile(configPath, "utf8");
  const loaded = JSON.parse(raw);
  return { ...args, ...loaded };
}

function splitList(value) {
  if (value === undefined || value === null || value === "") return undefined;
  if (Array.isArray(value)) return value.map(String);
  return String(value)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function unique(items) {
  return [...new Set(items.filter(Boolean))];
}

function normalizeHookName(name) {
  const normalized = String(name).trim();
  return HOOK_ALIASES.get(normalized) ?? normalized;
}

async function pathExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function readTextIfExists(filePath) {
  try {
    return await fs.readFile(filePath, "utf8");
  } catch {
    return "";
  }
}

async function listSkillNames() {
  const root = path.join(KIT_ROOT, ".agents", "skills");
  const entries = await fs.readdir(root, { withFileTypes: true });
  const names = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (await pathExists(path.join(root, entry.name, "SKILL.md"))) names.push(entry.name);
  }
  return names.sort();
}

async function listAgentNames() {
  const root = path.join(KIT_ROOT, ".codex", "agents");
  const entries = await fs.readdir(root, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile() && entry.name.endsWith(".toml"))
    .map((entry) => entry.name.replace(/\.toml$/, ""))
    .sort();
}

async function listHookNames() {
  return [...DEFAULT_HOOKS].sort();
}

function pythonExecutableNames() {
  return process.platform === "win32" ? ["python.exe"] : ["python", "python3"];
}

function pythonBinDir() {
  return process.platform === "win32" ? "Scripts" : "bin";
}

function uniquePythonChoices(choices) {
  const seen = new Set();
  const result = [];
  for (const choice of choices) {
    if (!choice?.value || seen.has(choice.value)) continue;
    seen.add(choice.value);
    result.push(choice);
  }
  return result;
}

async function addPythonCandidate(choices, filePath, label, source = "detected") {
  if (!filePath) return;
  if (!(await pathExists(filePath))) return;
  choices.push({ value: filePath, label, source });
}

async function addPythonVenvCandidates(choices, root, labelPrefix) {
  if (!(await pathExists(root))) return;
  for (const name of pythonExecutableNames()) {
    await addPythonCandidate(choices, path.join(root, pythonBinDir(), name), `${labelPrefix} (${name})`);
  }
}

async function addPythonVenvChildren(choices, root, labelPrefix) {
  let entries = [];
  try {
    entries = await fs.readdir(root, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    await addPythonVenvCandidates(choices, path.join(root, entry.name), `${labelPrefix}/${entry.name}`);
  }
}

async function detectPythonRunners(target) {
  const choices = [{ value: "auto", label: "auto (ckit detects best available Python)", source: "default" }];
  const home = process.env.USERPROFILE || process.env.HOME || "";
  const localAppData = process.env.LOCALAPPDATA || "";

  if (process.env.CK_PYTHON) {
    await addPythonCandidate(choices, process.env.CK_PYTHON, `CK_PYTHON: ${process.env.CK_PYTHON}`, "env");
  }

  await addPythonVenvCandidates(choices, path.join(target, ".venv"), "project .venv");
  await addPythonVenvCandidates(choices, path.join(target, ".agents", "skills", ".venv"), "project .agents/skills/.venv");
  await addPythonVenvCandidates(choices, path.join(target, ".codex", "skills", ".venv"), "project .codex/skills/.venv");

  if (home) {
    await addPythonVenvCandidates(choices, path.join(home, ".venv"), "~/.venv");
    await addPythonVenvCandidates(choices, path.join(home, ".venv", "shared"), "~/.venv/shared");
    await addPythonVenvChildren(choices, path.join(home, ".venv"), "~/.venv");
    await addPythonVenvChildren(choices, path.join(home, ".virtualenvs"), "~/.virtualenvs");
    await addPythonVenvChildren(choices, path.join(home, ".pyenv", "versions"), "~/.pyenv/versions");

    for (const condaRoot of ["miniconda3", "anaconda3", "mambaforge", "miniforge3"]) {
      const root = path.join(home, condaRoot);
      await addPythonCandidate(
        choices,
        process.platform === "win32" ? path.join(root, "python.exe") : path.join(root, "bin", "python"),
        `~/${condaRoot} base`,
        "conda",
      );
      const envsRoot = path.join(root, "envs");
      let envs = [];
      try {
        envs = await fs.readdir(envsRoot, { withFileTypes: true });
      } catch {
        envs = [];
      }
      for (const env of envs) {
        if (!env.isDirectory()) continue;
        const pythonPath = process.platform === "win32"
          ? path.join(envsRoot, env.name, "python.exe")
          : path.join(envsRoot, env.name, "bin", "python");
        await addPythonCandidate(choices, pythonPath, `~/${condaRoot}/envs/${env.name}`, "conda");
      }
    }
  }

  if (process.platform === "win32" && localAppData) {
    const pythonRoot = path.join(localAppData, "Programs", "Python");
    let entries = [];
    try {
      entries = await fs.readdir(pythonRoot, { withFileTypes: true });
    } catch {
      entries = [];
    }
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      await addPythonCandidate(choices, path.join(pythonRoot, entry.name, "python.exe"), `%LOCALAPPDATA%/Programs/Python/${entry.name}`);
    }
  }

  if (process.platform === "win32") {
    choices.push({ value: "py -3", label: "Windows launcher: py -3", source: "system" });
    choices.push({ value: "python", label: "system python", source: "system" });
  } else {
    choices.push({ value: "python3", label: "system python3", source: "system" });
    choices.push({ value: "python", label: "system python", source: "system" });
  }

  return uniquePythonChoices(choices);
}

function defaultPythonRunner(pythonChoices, requested) {
  if (requested) return requested;
  const detected = pythonChoices.find((choice) => choice.value !== "auto" && choice.source !== "system");
  return detected?.value ?? "auto";
}

async function walkFiles(root, limit = 5000) {
  const files = [];
  async function walk(dir, depth) {
    if (files.length >= limit || depth > 5) return;
    let entries = [];
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (files.length >= limit) return;
      const fullPath = path.join(dir, entry.name);
      const rel = path.relative(root, fullPath);
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name)) await walk(fullPath, depth + 1);
      } else if (entry.isFile()) {
        files.push(rel);
      }
    }
  }
  await walk(root, 0);
  return files;
}

async function isProjectRoot(dir) {
  for (const marker of PROJECT_MARKERS) {
    if (await pathExists(path.join(dir, marker))) return true;
  }
  return false;
}

async function findProjects(root, { maxDepth = 2, includeRoot = false } = {}) {
  const projects = [];
  const seen = new Set();

  async function scan(dir, depth) {
    if (depth > maxDepth) return;
    let entries = [];
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (!entry.isDirectory() || SKIP_DIRS.has(entry.name)) continue;
      const child = path.join(dir, entry.name);
      const childIsProject = await isProjectRoot(child);
      if (childIsProject) {
        const resolved = path.resolve(child);
        if (!seen.has(resolved)) {
          seen.add(resolved);
          projects.push(resolved);
        }
        continue;
      }
      await scan(child, depth + 1);
    }
  }

  if (includeRoot && (await isProjectRoot(root))) {
    const resolved = path.resolve(root);
    seen.add(resolved);
    projects.push(resolved);
  }

  await scan(root, 1);
  return projects.sort((a, b) => a.localeCompare(b));
}

async function findTargetFolders(root, { maxDepth = 2 } = {}) {
  const folders = [];
  const seen = new Set();

  async function scan(dir, depth) {
    if (depth > maxDepth) return;
    let entries = [];
    try {
      entries = await fs.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (entry.name.startsWith(".") || SKIP_DIRS.has(entry.name) || entry.name === "plans") continue;
      const child = path.resolve(path.join(dir, entry.name));
      if (!seen.has(child)) {
        seen.add(child);
        folders.push(child);
      }
      await scan(child, depth + 1);
    }
  }

  await scan(root, 1);
  return folders.sort((a, b) => a.localeCompare(b));
}

async function analyzeProject(target) {
  const files = await walkFiles(target);
  const lowerFiles = files.map((file) => file.toLowerCase());
  const fileSet = new Set(lowerFiles);
  const types = new Set();
  const reasons = [];
  const packages = new Set();

  const add = (type, reason) => {
    types.add(type);
    reasons.push(reason);
  };

  const hasFile = (name) => fileSet.has(name.toLowerCase());
  const hasBasename = (name) => {
    const lowerName = name.toLowerCase();
    return lowerFiles.some((file) => file === lowerName || file.endsWith(`/${lowerName}`));
  };
  const hasEnding = (suffix) => lowerFiles.some((file) => file.endsWith(suffix));
  const hasPart = (part) => lowerFiles.some((file) => file.includes(part));

  const packageJsonFiles = files.filter((file) => path.basename(file).toLowerCase() === "package.json");
  if (packageJsonFiles.length > 0) {
    add("javascript", `${packageJsonFiles.length} package.json file(s) found`);
  }
  for (const packageJsonFile of packageJsonFiles) {
    const raw = await readTextIfExists(path.join(target, packageJsonFile));
    try {
      const packageJson = JSON.parse(raw);
      const deps = {
        ...packageJson.dependencies,
        ...packageJson.devDependencies,
        ...packageJson.peerDependencies,
        ...packageJson.optionalDependencies,
      };
      for (const name of Object.keys(deps)) packages.add(name.toLowerCase());
    } catch {
      reasons.push(`${packageJsonFile} could not be parsed`);
    }
  }

  const hasPkg = (...names) => names.some((name) => packages.has(name));
  const hasPkgIncludes = (...parts) => [...packages].some((name) => parts.some((part) => name.includes(part)));

  if (hasBasename("tsconfig.json") || hasEnding(".ts") || hasEnding(".tsx")) add("typescript", "TypeScript files/config found");
  if (hasPkg("react", "next", "vite", "@vitejs/plugin-react", "remix", "@remix-run/react") || hasEnding(".tsx")) add("frontend", "React/Next/Vite or TSX detected");
  if (hasPkg("react")) add("react", "react dependency found");
  if (hasPkgIncludes("@tanstack/")) add("tanstack", "TanStack package found");
  if (hasBasename("tailwind.config.js") || hasBasename("tailwind.config.ts") || hasPkg("tailwindcss")) add("frontend", "Tailwind config/dependency found");
  if (hasPkg("express", "fastify", "hono", "koa", "@nestjs/core", "nestjs", "apollo-server", "graphql-yoga")) add("backend", "Node backend framework found");
  if (hasBasename("pyproject.toml") || hasBasename("requirements.txt") || hasEnding(".py")) add("backend", "Python project files found");
  if (hasBasename("pom.xml") || hasBasename("build.gradle") || hasBasename("build.gradle.kts")) add("backend", "Java/JVM project files found");
  if (hasBasename("go.mod")) add("backend", "Go module found");
  if (hasBasename("schema.prisma") || hasPart("migrations/") || hasEnding(".sql") || hasPkg("prisma", "@prisma/client", "typeorm", "sequelize", "mongoose", "drizzle-orm")) add("database", "database schema/migrations/ORM found");
  if (hasPkg("better-auth", "next-auth", "@auth/core", "passport", "jsonwebtoken") || hasPart("auth")) add("auth", "auth dependency or auth path found");
  if (hasBasename("dockerfile") || hasBasename("docker-compose.yml") || hasBasename("docker-compose.yaml") || hasPart("k8s/") || hasPart("kubernetes/")) add("devops", "Docker/Kubernetes assets found");
  if (hasPkg("playwright", "cypress", "vitest", "jest", "@testing-library/react") || hasPart("__tests__") || hasEnding(".test.ts") || hasEnding(".spec.ts")) add("testing", "test framework or test files found");
  if (hasPart("docs/") || hasBasename("mint.json") || hasBasename("docs.json") || hasEnding(".mdx")) add("documentation", "docs folder or docs tooling found");
  if (hasEnding(".docx") || hasEnding(".doc") || hasEnding(".pdf") || hasEnding(".pptx") || hasEnding(".xlsx") || hasEnding(".xlsm") || hasEnding(".csv") || hasEnding(".tsv")) {
    add("documents", "office/PDF/spreadsheet files found");
  }
  if (hasPkg("react-native", "expo") || hasBasename("pubspec.yaml") || hasPart("android/") || hasPart("ios/")) add("mobile", "mobile project assets found");
  if (hasPkgIncludes("stripe", "paypal", "sepay", "polar")) add("payments", "payment package found");
  if (hasPkgIncludes("shopify") || hasPart("shopify")) add("shopify", "Shopify package/path found");
  if (hasPkg("three") || hasEnding(".glsl") || hasEnding(".wgsl")) add("threejs", "Three.js or shader assets found");
  if (hasPkg("remotion") || hasBasename("remotion.config.ts") || hasBasename("remotion.config.js")) add("remotion", "Remotion config/dependency found");
  if (hasPkgIncludes("openai", "langchain", "llamaindex", "openai") || hasPart("mcp")) add("ai", "AI/MCP package or path found");
  if (hasPart(".mcp") || hasBasename("mcp.json") || hasBasename(".mcp.json")) add("mcp", "MCP config found");

  return {
    filesScanned: files.length,
    packageCount: packages.size,
    types: [...types].sort(),
    reasons: unique(reasons),
  };
}

function recommendFromAnalysis(analysis) {
  const skills = [...CORE_SKILLS];
  const agents = [...CORE_AGENTS];

  for (const rule of DETECTION_RULES) {
    if (!analysis.types.includes(rule.id)) continue;
    skills.push(...rule.skills);
    agents.push(...rule.agents);
  }

  if (analysis.types.includes("testing")) skills.push("web-testing");
  if (analysis.types.includes("frontend") && analysis.types.includes("backend")) agents.push("fullstack_developer");
  if (analysis.types.length === 0) skills.push("find-skills");

  return {
    skills: unique(skills),
    agents: unique(agents),
    hooks: [...DEFAULT_HOOKS],
  };
}

function filterKnown(selection, available, type) {
  const availableSet = new Set(available);
  const unknown = selection.filter((item) => !availableSet.has(item));
  if (unknown.length > 0) {
    throw new Error(`Unknown ${type}: ${unknown.join(", ")}`);
  }
  return selection;
}

function resolveSelection({ args, availableSkills, availableAgents, availableHooks, recommended }) {
  const profile = args.profile ?? "default";
  const requestedSkills = splitList(args.skills);
  const requestedAgents = splitList(args.agents);
  const requestedHooks = splitList(args.hooks)?.map(normalizeHookName);

  let skills = [];
  let agents = [];
  let hooks = [];

  if (profile === "minimal") {
    skills = ["ask", "plan", "code-review", "test", "debug", "fix", "git", "docs"];
    agents = ["planner", "code_reviewer", "tester", "debugger", "git_manager"];
    hooks = ["privacy-block"];
  } else if (profile === "all") {
    skills = [...availableSkills];
    agents = [...availableAgents];
    hooks = [...availableHooks];
  } else if (profile === "custom") {
    if (args.withRecommended) {
      skills = [...recommended.skills];
      agents = [...recommended.agents];
      hooks = [...recommended.hooks];
    }
  } else if (profile === "default" || profile === "recommended") {
    skills = [...recommended.skills];
    agents = [...recommended.agents];
    hooks = [...recommended.hooks];
  } else {
    throw new Error(`Unknown profile: ${profile}`);
  }

  if (requestedSkills) {
    if (requestedSkills.includes("all")) skills = [...availableSkills];
    else if (requestedSkills.includes("none")) skills = [];
    else skills = profile === "custom" && !args.withRecommended ? requestedSkills : unique([...skills, ...requestedSkills]);
  }

  if (requestedAgents) {
    if (requestedAgents.includes("all")) agents = [...availableAgents];
    else if (requestedAgents.includes("none")) agents = [];
    else agents = profile === "custom" && !args.withRecommended ? requestedAgents : unique([...agents, ...requestedAgents]);
  }

  if (requestedHooks) {
    if (requestedHooks.includes("all")) hooks = [...availableHooks];
    else if (requestedHooks.includes("none")) hooks = [];
    else hooks = profile === "custom" && !args.withRecommended ? requestedHooks : unique([...hooks, ...requestedHooks]);
  }

  return {
    skills: filterKnown(unique(skills), availableSkills, "skills"),
    agents: filterKnown(unique(agents), availableAgents, "agents"),
    hooks: filterKnown(unique(hooks.map(normalizeHookName)), availableHooks, "hooks"),
  };
}

async function copyDirectory(source, destination, { dryRun, force, actions }) {
  const exists = await pathExists(destination);
  if (exists && !force) {
    actions.push(`skip existing ${destination}`);
    return;
  }
  actions.push(`${exists ? "overwrite" : "copy"} ${source} -> ${destination}`);
  if (dryRun) return;
  await fs.mkdir(path.dirname(destination), { recursive: true });
  if (exists && force) await fs.rm(destination, { recursive: true, force: true });
  await fs.cp(source, destination, {
    recursive: true,
    filter: (src) => !src.split(path.sep).includes("__tests__") && !src.endsWith(".DS_Store"),
  });
}

async function copyFile(source, destination, { dryRun, force, actions }) {
  const exists = await pathExists(destination);
  if (exists && !force) {
    actions.push(`skip existing ${destination}`);
    return;
  }
  actions.push(`${exists ? "overwrite" : "copy"} ${source} -> ${destination}`);
  if (dryRun) return;
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.copyFile(source, destination);
}

async function copyTreeMerge(source, destination, { dryRun, force, actions }) {
  const entries = await fs.readdir(source, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === ".DS_Store" || entry.name === "__pycache__" || entry.name === ".venv" || entry.name === "__tests__" || entry.name === "tests") continue;
    const sourcePath = path.join(source, entry.name);
    const destinationPath = path.join(destination, entry.name);
    if (entry.isDirectory()) {
      await copyTreeMerge(sourcePath, destinationPath, { dryRun, force, actions });
    } else if (entry.isFile()) {
      await copyFile(sourcePath, destinationPath, { dryRun, force, actions });
    }
  }
}

async function cleanupMisnestedKit(target, { dryRun, actions }) {
  const nestedPaths = [
    path.join(target, ".codex", "scripts", ".codex"),
    path.join(target, ".codex", "scripts", ".agents"),
    path.join(target, ".codex", "scripts", "AGENTS.md"),
  ];
  for (const nestedPath of nestedPaths) {
    if (!(await pathExists(nestedPath))) continue;
    actions.push(`remove misnested kit artifact ${nestedPath}`);
    if (!dryRun) await fs.rm(nestedPath, { recursive: true, force: true });
  }
}

function replaceManagedSection(content, [start, end], replacement) {
  const block = `${start}\n${replacement.trimEnd()}\n${end}`;
  const startIndex = content.indexOf(start);
  const endIndex = content.indexOf(end);
  if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
    return `${content.slice(0, startIndex).trimEnd()}\n\n${block}\n${content.slice(endIndex + end.length).trimStart()}`;
  }
  return `${content.trimEnd()}\n\n${block}\n`;
}

async function repairHookWrappers(target, { dryRun = false } = {}) {
  const sourceHooks = path.join(KIT_ROOT, ".codex", "hooks");
  const targetHooks = path.join(target, ".codex", "hooks");
  const entries = await fs.readdir(sourceHooks, { withFileTypes: true });
  const actions = [];

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".cjs")) continue;
    const sourcePath = path.join(sourceHooks, entry.name);
    const sourceText = await fs.readFile(sourcePath, "utf8");
    if (!sourceText.includes("Codex hook compatibility wrapper")) continue;
    const targetPath = path.join(targetHooks, entry.name);
    if (!(await pathExists(targetPath))) continue;
    actions.push(`refresh ${targetPath}`);
    if (!dryRun) await fs.copyFile(sourcePath, targetPath);
  }

  return actions;
}

function parseAgentConfigBlocks(configText) {
  const lines = configText.split(/\r?\n/);
  const blocks = new Map();
  let currentName = null;
  let currentLines = [];

  const flush = () => {
    if (currentName) blocks.set(currentName, currentLines.join("\n").trimEnd());
    currentName = null;
    currentLines = [];
  };

  for (const line of lines) {
    const match = line.match(/^\[agents\.([^\]]+)\]/);
    if (match) {
      flush();
      currentName = match[1];
      currentLines = [line];
    } else if (currentName && (line.startsWith("[") || line.startsWith("# --- ck-managed-agents-end"))) {
      flush();
    } else if (currentName) {
      currentLines.push(line);
    }
  }
  flush();
  return blocks;
}

async function writeCodexConfig(target, selected, { dryRun, actions }) {
  const targetConfigPath = path.join(target, ".codex", "config.toml");
  const sourceConfig = await readTextIfExists(path.join(KIT_ROOT, ".codex", "config.toml"));
  const blocks = parseAgentConfigBlocks(sourceConfig);
  const agentConfig = selected.agents
    .map((agent) => blocks.get(agent))
    .filter(Boolean)
    .join("\n\n");
  const featureConfig = `[features]\nhooks = ${selected.hooks.length > 0 ? "true" : "false"}`;
  let targetConfig = await readTextIfExists(targetConfigPath);
  targetConfig = replaceManagedSection(targetConfig, MANAGED.agents, agentConfig || "# no Codex kit agents selected");
  targetConfig = replaceManagedSection(targetConfig, MANAGED.features, featureConfig);

  actions.push(`merge ${targetConfigPath}`);
  if (dryRun) return;
  await fs.mkdir(path.dirname(targetConfigPath), { recursive: true });
  await fs.writeFile(targetConfigPath, targetConfig);
}

function quoteForCommand(filePath) {
  return `"${filePath.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function hookNameFromCommand(command) {
  const base = path.basename(command.trim().split(/\s+/).at(-1) ?? "");
  for (const hook of DEFAULT_HOOKS) {
    if (base.includes(hook)) return hook;
  }
  return null;
}

async function writeHooksJson(target, selected, { dryRun, actions }) {
  const sourcePath = path.join(KIT_ROOT, ".codex", "hooks.json");
  const targetPath = path.join(target, ".codex", "hooks.json");
  const source = JSON.parse(await fs.readFile(sourcePath, "utf8"));
  const selectedSet = new Set(selected.hooks);
  const rewritten = { hooks: {} };

  for (const [event, groups] of Object.entries(source.hooks ?? {})) {
    const keptGroups = [];
    for (const group of groups) {
      const keptHooks = [];
      for (const hook of group.hooks ?? []) {
        if (hook.type !== "command" || !hook.command) continue;
        const hookName = hookNameFromCommand(hook.command);
        if (!hookName || !selectedSet.has(hookName)) continue;
        const basename = path.basename(hook.command.trim().split(/\s+/).at(-1));
        keptHooks.push({
          ...hook,
          command: `node ${quoteForCommand(path.join(target, ".codex", "hooks", basename))}`,
        });
      }
      if (keptHooks.length > 0) keptGroups.push({ ...group, hooks: keptHooks });
    }
    if (keptGroups.length > 0) rewritten.hooks[event] = keptGroups;
  }

  actions.push(selected.hooks.length > 0 ? `write ${targetPath}` : `skip hooks.json (no hooks selected)`);
  if (dryRun || selected.hooks.length === 0) return;
  await fs.mkdir(path.dirname(targetPath), { recursive: true });
  await fs.writeFile(targetPath, `${JSON.stringify(rewritten, null, 2)}\n`);
}

function buildAgentsMdBlock(selected, analysis, { skipPlanTemplates = false, planTemplatesRoot = null } = {}) {
  const projectTypes = analysis.types.length > 0 ? analysis.types.join(", ") : "unknown";
  const planTemplatesLine = skipPlanTemplates
    ? `- Plan templates are managed at \`${planTemplatesRoot ?? "the selected kit target"}/plans/templates\`; keep plans/reports there unless the user explicitly asks for this child repo.`
    : "- Plan templates are available under `plans/templates`; create plans/reports in this kit target directory unless the user explicitly asks for a child repo plan.";
  return `## Codex Kit

This project has a local Codex kit installed.

- Project signals detected by installer: ${projectTypes}
- Skills are available under \`.agents/skills\`; use the most relevant skill before specialized work.
- Skill support files such as install scripts and shared helpers are available under \`.agents/skills\`.
- Custom agents are configured under \`.codex/agents\`; spawn subagents only when the task benefits from delegation.
- Hooks may enforce privacy, scout checks, and post-edit simplification reminders.
- Workflow rules are available under \`.codex/rules\`; read relevant rules before planning or implementation.
- Helper scripts are available under \`.codex/scripts\`; use these project-local paths for kit utilities.
- Active plan state, when set, is stored at \`.codex/state/active-plan.json\`; check it before implementing plan-driven work.
${planTemplatesLine}
- CodexKit reference docs are available under \`.codex/docs\`; use them for agent-team guidance, code standards, architecture, skill maps, and research notes.
- Output style references are available under \`.codex/output-styles\`; use them as tone/detail guides when the user asks for a specific level.
- Keep changes scoped to the user's request and preserve existing project conventions.

Installed agents: ${selected.agents.length > 0 ? selected.agents.join(", ") : "none"}

Installed skills: ${selected.skills.length > 0 ? selected.skills.join(", ") : "none"}

Enabled hooks: ${selected.hooks.length > 0 ? selected.hooks.join(", ") : "none"}`;
}

async function writeAgentsMd(target, selected, analysis, { dryRun, actions, skipAgentsMd, skipPlanTemplates, planTemplatesRoot }) {
  if (skipAgentsMd) {
    actions.push("skip AGENTS.md (--skip-agents-md)");
    return;
  }
  const filePath = path.join(target, "AGENTS.md");
  const current = await readTextIfExists(filePath);
  const next = replaceManagedSection(current || "# AGENTS.md\n", MANAGED.agentsMd, buildAgentsMdBlock(selected, analysis, { skipPlanTemplates, planTemplatesRoot }));
  actions.push(`merge ${filePath}`);
  if (dryRun) return;
  await fs.writeFile(filePath, next);
}

async function writeTargetPathConfig(target, { dryRun, actions, planTemplatesRoot }) {
  const configPath = path.join(target, ".codex", ".ck.json");
  if (!planTemplatesRoot) return;
  const rootPlansPath = path.join(planTemplatesRoot, "plans");
  actions.push(`set ${configPath} paths.plans=${rootPlansPath}`);
  if (dryRun) return;

  let config = {};
  const raw = await readTextIfExists(configPath);
  if (raw.trim()) {
    try {
      config = JSON.parse(raw);
    } catch {
      config = {};
    }
  }
  config.paths = {
    ...(config.paths ?? {}),
    plans: rootPlansPath,
  };
  await fs.mkdir(path.dirname(configPath), { recursive: true });
  await fs.writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`);
}

async function writePythonConfig(target, pythonRunner, { dryRun, actions }) {
  const configPath = path.join(target, ".codex", ".ck.json");
  const value = pythonRunner || "auto";
  actions.push(`set ${configPath} python.runner=${value}`);
  if (dryRun) return;

  let config = {};
  const raw = await readTextIfExists(configPath);
  if (raw.trim()) {
    try {
      config = JSON.parse(raw);
    } catch {
      config = {};
    }
  }
  config.python = {
    ...(config.python ?? {}),
    runner: value,
  };
  await fs.mkdir(path.dirname(configPath), { recursive: true });
  await fs.writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`);
}

async function applySelection(target, selected, analysis, options) {
  const actions = [];
  const codexSupportFiles = [".ckignore", ".ck.json", ".env.example"];
  const skillSupportDirectories = ["common"];
  const skillSupportFiles = [
    ".env.example",
    ".gitignore",
    "INSTALLATION.md",
    "README.md",
    "THIRD_PARTY_NOTICES.md",
    "agent_skills_spec.md",
    "install.sh",
    "install.ps1",
  ];
  const sourceSkills = path.join(KIT_ROOT, ".agents", "skills");
  const sourceAgents = path.join(KIT_ROOT, ".codex", "agents");
  const sourceHooks = path.join(KIT_ROOT, ".codex", "hooks");
  const sourceRules = path.join(KIT_ROOT, ".codex", "rules");
  const sourceScripts = path.join(KIT_ROOT, ".codex", "scripts");
  const sourceOutputStyles = path.join(KIT_ROOT, ".codex", "output-styles");
  const sourcePlanTemplates = path.join(KIT_ROOT, "plans", "templates");
  const sourceDocs = path.join(KIT_ROOT, "docs");
  const targetSkills = path.join(target, ".agents", "skills");
  const targetAgents = path.join(target, ".codex", "agents");
  const targetHooks = path.join(target, ".codex", "hooks");
  const targetRules = path.join(target, ".codex", "rules");
  const targetScripts = path.join(target, ".codex", "scripts");
  const targetOutputStyles = path.join(target, ".codex", "output-styles");
  const targetPlanTemplates = path.join(target, "plans", "templates");
  const targetDocs = path.join(target, ".codex", "docs");

  await cleanupMisnestedKit(target, { ...options, actions });

  for (const file of codexSupportFiles) {
    const sourcePath = path.join(KIT_ROOT, ".codex", file);
    if (await pathExists(sourcePath)) {
      await copyFile(sourcePath, path.join(target, ".codex", file), { ...options, actions });
    }
  }
  await writeTargetPathConfig(target, { ...options, actions });
  await writePythonConfig(target, options.pythonRunner, { ...options, actions });

  if (await pathExists(sourceRules)) {
    await copyTreeMerge(sourceRules, targetRules, { ...options, actions });
  }

  if (await pathExists(sourceScripts)) {
    await copyTreeMerge(sourceScripts, targetScripts, { ...options, actions });
  }

  if (await pathExists(sourceOutputStyles)) {
    await copyTreeMerge(sourceOutputStyles, targetOutputStyles, { ...options, actions });
  }

  if (options.skipPlanTemplates) {
    actions.push(`skip ${targetPlanTemplates} (plan templates managed at ${options.planTemplatesRoot ?? "selected root"})`);
  } else if (await pathExists(sourcePlanTemplates)) {
    await copyTreeMerge(sourcePlanTemplates, targetPlanTemplates, { ...options, actions });
  }

  if (await pathExists(sourceDocs)) {
    await copyTreeMerge(sourceDocs, targetDocs, { ...options, actions });
  }

  for (const directory of skillSupportDirectories) {
    const sourcePath = path.join(sourceSkills, directory);
    if (await pathExists(sourcePath)) {
      await copyTreeMerge(sourcePath, path.join(targetSkills, directory), { ...options, actions });
    }
  }

  for (const file of skillSupportFiles) {
    const sourcePath = path.join(sourceSkills, file);
    if (await pathExists(sourcePath)) {
      await copyFile(sourcePath, path.join(targetSkills, file), { ...options, actions });
    }
  }

  for (const skill of selected.skills) {
    await copyDirectory(path.join(sourceSkills, skill), path.join(targetSkills, skill), { ...options, actions });
  }

  for (const agent of selected.agents) {
    await copyFile(path.join(sourceAgents, `${agent}.toml`), path.join(targetAgents, `${agent}.toml`), { ...options, actions });
  }

  if (selected.hooks.length > 0) {
    await copyTreeMerge(sourceHooks, targetHooks, { ...options, actions });
  }

  await writeCodexConfig(target, selected, { ...options, actions });
  await writeHooksJson(target, selected, { ...options, actions });
  await writeAgentsMd(target, selected, analysis, { ...options, actions });
  return actions;
}

async function copyRootPlanTemplates(target, { dryRun = false, force = false } = {}) {
  const actions = [];
  const sourcePlanTemplates = path.join(KIT_ROOT, "plans", "templates");
  const targetPlanTemplates = path.join(target, "plans", "templates");
  if (await pathExists(sourcePlanTemplates)) {
    await copyTreeMerge(sourcePlanTemplates, targetPlanTemplates, { dryRun, force, actions });
  }
  return actions;
}

function printSummary({ target, analysis, recommended, selected, pythonRunner, actions, dryRun, details = true, showActions = true }) {
  console.log(`\nCodex kit target: ${target}`);
  console.log(`Mode: ${dryRun ? "dry-run" : "apply"}`);
  console.log(`Scanned: ${analysis.filesScanned} files, ${analysis.packageCount} packages`);
  console.log(`Detected: ${analysis.types.length > 0 ? analysis.types.join(", ") : "no strong project signals"}`);
  if (analysis.reasons.length > 0) {
    console.log("\nSignals:");
    for (const reason of analysis.reasons) console.log(`  - ${reason}`);
  }

  console.log("\nRecommended:");
  console.log(
    details
      ? `  Agents (${recommended.agents.length}): ${recommended.agents.join(", ")}`
      : `  Agents (${recommended.agents.length})`,
  );
  console.log(
    details
      ? `  Skills (${recommended.skills.length}): ${recommended.skills.join(", ")}`
      : `  Skills (${recommended.skills.length})`,
  );
  console.log(
    details
      ? `  Hooks  (${recommended.hooks.length}): ${recommended.hooks.join(", ")}`
      : `  Hooks  (${recommended.hooks.length})`,
  );

  console.log("\nSelected:");
  console.log(details ? `  Agents (${selected.agents.length}): ${selected.agents.join(", ") || "none"}` : `  Agents (${selected.agents.length})`);
  console.log(details ? `  Skills (${selected.skills.length}): ${selected.skills.join(", ") || "none"}` : `  Skills (${selected.skills.length})`);
  console.log(details ? `  Hooks  (${selected.hooks.length}): ${selected.hooks.join(", ") || "none"}` : `  Hooks  (${selected.hooks.length})`);
  if (pythonRunner !== undefined) {
    console.log(`  Python: ${pythonRunner || "auto"}`);
  }

  if (actions?.length && showActions) {
    console.log(`\nActions (${actions.length}):`);
    for (const action of actions) console.log(`  - ${action}`);
  } else if (actions?.length) {
    console.log(`\nActions: ${actions.length}`);
  }
}

function printBatchSummary({ root, results, dryRun, verbose, details }) {
  console.log(`\nCodex kit projects root: ${root}`);
  console.log(`Mode: ${dryRun ? "dry-run" : "apply"}`);
  console.log(`Projects detected: ${results.length}`);
  console.log("Install scope: each detected child project. For umbrella-folder-only install, use --target . instead of --all-projects.");
  console.log(`Plan templates: root only (${path.join(root, "plans", "templates")}).`);

  for (const result of results) {
    const rel = path.relative(root, result.target) || ".";
    const detected = result.analysis.types.length > 0 ? result.analysis.types.join(", ") : "unknown";
    console.log(
      `\n- ${rel}: ${detected}\n` +
        `  selected: ${result.selected.skills.length} skills, ${result.selected.agents.length} agents, ${result.selected.hooks.length} hooks`,
    );
    if (details) {
      console.log(`  skills: ${result.selected.skills.join(", ") || "none"}`);
      console.log(`  agents: ${result.selected.agents.join(", ") || "none"}`);
      console.log(`  hooks: ${result.selected.hooks.join(", ") || "none"}`);
      console.log(`  python: ${result.pythonRunner || "auto"}`);
    }
    if (verbose) {
      for (const action of result.actions) console.log(`  - ${action}`);
    }
  }
}

async function confirmIfNeeded(args) {
  if (args.dryRun || args.suggestOnly || args.yes) return;
  if (!process.stdin.isTTY) {
    throw new Error("Refusing to write in non-interactive mode without --yes. Re-run with --dry-run or --yes.");
  }
  const rl = readlinePromises.createInterface({ input, output });
  const answer = await rl.question("Apply Codex kit to this project? [y/N] ");
  rl.close();
  if (!/^y(es)?$/i.test(answer.trim())) throw new Error("Cancelled.");
}

async function planTarget(target, args, availableSkills, availableAgents, availableHooks, applyOptions = {}) {
  const analysis = await analyzeProject(target);
  const recommended = recommendFromAnalysis(analysis);
  const selected = resolveSelection({ args, availableSkills, availableAgents, availableHooks, recommended });
  const pythonChoices = await detectPythonRunners(target);
  const pythonRunner = defaultPythonRunner(pythonChoices, args.python);
  const actions = await applySelection(target, selected, analysis, {
    dryRun: true,
    force: args.force,
    skipAgentsMd: args.skipAgentsMd,
    skipPlanTemplates: applyOptions.skipPlanTemplates,
    planTemplatesRoot: applyOptions.planTemplatesRoot,
    pythonRunner,
  });
  return { target, analysis, recommended, selected, pythonChoices, pythonRunner, actions };
}

async function applyPlannedTarget(result, args, applyOptions = {}) {
  const actions = await applySelection(result.target, result.selected, result.analysis, {
    dryRun: false,
    force: args.force,
    skipAgentsMd: args.skipAgentsMd,
    skipPlanTemplates: applyOptions.skipPlanTemplates,
    planTemplatesRoot: applyOptions.planTemplatesRoot,
    pythonRunner: result.pythonRunner,
  });
  return { ...result, actions };
}

function summarizeSelected(selected) {
  return `${selected.skills.length} skills, ${selected.agents.length} agents, ${selected.hooks.length} hooks`;
}

function printSelectorHeader(planned) {
  const detected = planned.analysis.types.length > 0 ? planned.analysis.types.join(", ") : "unknown";
  console.log("\nCodex Kit Selector");
  console.log(`Target: ${planned.target}`);
  console.log(`Detected: ${detected}`);
  console.log(`Current: ${summarizeSelected(planned.selected)}`);
}

function printSelectableList(title, available, selected, recommended) {
  const selectedSet = new Set(selected);
  const recommendedSet = new Set(recommended);
  console.log(`\n[${title}]`);
  console.log("Use numbers/names to toggle. Commands: all, none, default, done");
  available.forEach((item, index) => {
    const checked = selectedSet.has(item) ? "x" : " ";
    const marker = recommendedSet.has(item) ? "*" : " ";
    console.log(`${String(index + 1).padStart(2, " ")}. [${checked}]${marker} ${item}`);
  });
  console.log("* = recommended by project scan");
}

function applySelectorCommand(inputValue, available, current, defaults) {
  const value = inputValue.trim();
  if (!value) return current;
  const lower = value.toLowerCase();
  if (lower === "done" || lower === "d" || lower === "back" || lower === "b") return current;
  if (lower === "all") return [...available];
  if (lower === "none") return [];
  if (lower === "default" || lower === "recommended") return [...defaults];

  const availableSet = new Set(available);
  const selectedSet = new Set(current);
  const tokens = value
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean);

  for (const token of tokens) {
    let mode = "toggle";
    let raw = token;
    if (raw.startsWith("+") || raw.startsWith("-")) {
      mode = raw.startsWith("+") ? "add" : "remove";
      raw = raw.slice(1);
    }

    const numeric = Number.parseInt(raw, 10);
    const item = Number.isInteger(numeric) && String(numeric) === raw ? available[numeric - 1] : raw;
    if (!item || !availableSet.has(item)) {
      console.log(`Unknown item: ${token}`);
      continue;
    }

    if (mode === "add") selectedSet.add(item);
    else if (mode === "remove") selectedSet.delete(item);
    else if (selectedSet.has(item)) selectedSet.delete(item);
    else selectedSet.add(item);
  }

  return available.filter((item) => selectedSet.has(item));
}

async function editSelectionTab(rl, title, available, selected, defaults) {
  let current = [...selected];
  while (true) {
    printSelectableList(title, available, current, defaults);
    const answer = await rl.question(`${title}> `);
    const lower = answer.trim().toLowerCase();
    if (!answer.trim() || lower === "done" || lower === "d" || lower === "back" || lower === "b") {
      return current;
    }
    current = applySelectorCommand(answer, available, current, defaults);
  }
}

async function refreshPlannedActions(planned, args) {
  const actions = await applySelection(planned.target, planned.selected, planned.analysis, {
    dryRun: true,
    force: args.force,
    skipAgentsMd: args.skipAgentsMd,
    pythonRunner: planned.pythonRunner,
  });
  return { ...planned, actions };
}

async function interactiveCustomize(planned, args, availableSkills, availableAgents, availableHooks) {
  if (!process.stdin.isTTY) {
    throw new Error("--interactive requires a terminal. Use --dry-run --details or pass --skills/--agents/--hooks explicitly.");
  }

  const originalTarget = path.resolve(planned.target);
  const discoveredTargets = await findProjects(originalTarget, {
    maxDepth: args.projectDepth,
    includeRoot: false,
  });
  const folderTargets = await findTargetFolders(originalTarget, {
    maxDepth: args.projectDepth,
  });
  const projectTargetSet = new Set(discoveredTargets.map((target) => path.resolve(target)));
  const targetChoices = unique([
    originalTarget,
    ...discoveredTargets.map((target) => path.resolve(target)),
    ...folderTargets.map((target) => path.resolve(target)),
  ]);

  let current = {
    ...planned,
    selected: {
      skills: [...planned.selected.skills],
      agents: [...planned.selected.agents],
      hooks: [...planned.selected.hooks],
    },
    pythonChoices: planned.pythonChoices ?? await detectPythonRunners(planned.target),
    pythonRunner: planned.pythonRunner ?? defaultPythonRunner(planned.pythonChoices ?? [], args.python),
  };

  const tabs = [
    { key: "target", label: "Target", available: targetChoices, defaults: [originalTarget] },
    { key: "python", label: "Python", available: current.pythonChoices, defaults: [current.pythonRunner || "auto"] },
    { key: "skills", label: "Skills", available: availableSkills, defaults: current.recommended.skills },
    { key: "agents", label: "Agents", available: availableAgents, defaults: current.recommended.agents },
    { key: "hooks", label: "Hooks", available: availableHooks, defaults: current.recommended.hooks },
    { key: "review", label: "Review", available: [], defaults: [] },
  ];

  const state = {
    activeTab: 0,
    cursor: { target: 0, python: 0, skills: 0, agents: 0, hooks: 0 },
    scroll: { target: 0, python: 0, skills: 0, agents: 0, hooks: 0 },
    message: "Use arrow keys. Space toggles selections. Enter applies. q cancels.",
    busy: false,
  };

  const getSelected = (key) => current.selected[key] ?? [];
  const setSelected = (key, value) => {
    current.selected[key] = value;
  };
  const selectedSet = (key) => new Set(getSelected(key));
  const formatTargetLabel = (target) => {
    const rel = path.relative(originalTarget, target);
    const suffix = projectTargetSet.has(path.resolve(target)) ? " (project)" : " (folder)";
    if (!rel) return ". (current target)";
    if (!rel.startsWith("..") && !path.isAbsolute(rel)) return `${rel}${suffix}`;
    return `${target}${suffix}`;
  };
  const refreshTabsFromCurrent = () => {
    const skillsTab = tabs.find((tab) => tab.key === "skills");
    const agentsTab = tabs.find((tab) => tab.key === "agents");
    const hooksTab = tabs.find((tab) => tab.key === "hooks");
    const pythonTab = tabs.find((tab) => tab.key === "python");
    if (skillsTab) skillsTab.defaults = current.recommended.skills;
    if (agentsTab) agentsTab.defaults = current.recommended.agents;
    if (hooksTab) hooksTab.defaults = current.recommended.hooks;
    if (pythonTab) {
      pythonTab.available = current.pythonChoices ?? [];
      pythonTab.defaults = [current.pythonRunner || "auto"];
    }
    state.cursor.target = Math.max(0, targetChoices.findIndex((target) => path.resolve(target) === path.resolve(current.target)));
    state.cursor.python = Math.max(0, (current.pythonChoices ?? []).findIndex((choice) => choice.value === current.pythonRunner));
  };

  const enterScreen = () => output.write("\x1b[?1049h\x1b[?25l");
  const leaveScreen = () => output.write("\x1b[?25h\x1b[?1049l");
  const inverse = (text) => `\x1b[7m${text}\x1b[0m`;
  const dim = (text) => `\x1b[2m${text}\x1b[0m`;
  const truncate = (text, width) => (text.length > width ? `${text.slice(0, Math.max(0, width - 1))}…` : text);
  const paint = (lines) => output.write(`\x1b[H${lines.join("\x1b[K\n")}\x1b[K\x1b[J`);

  const render = () => {
    const width = output.columns || 100;
    const height = output.rows || 32;
    const lines = [];
    const detected = current.analysis.types.length > 0 ? current.analysis.types.join(", ") : "unknown";
    const tabLine = tabs
      .map((tab, index) => (index === state.activeTab ? inverse(` ${tab.label} `) : ` ${tab.label} `))
      .join("  ");

    lines.push("Codex Kit Selector");
    lines.push(truncate(`Target: ${current.target}`, width));
    lines.push(truncate(`Detected: ${detected}`, width));
    lines.push(truncate(`Selected: ${summarizeSelected(current.selected)}`, width));
    lines.push("");
    lines.push(tabLine);
    lines.push(dim("←/→ tab  ↑/↓ move  Space choose/toggle  Enter apply  a all  n none  d default  q cancel"));
    lines.push("");

    const tab = tabs[state.activeTab];
    if (tab.key === "review") {
      lines.push("Review");
      lines.push("");
      lines.push(`Target: ${current.target}`);
      lines.push("");
      lines.push(`Skills (${current.selected.skills.length}): ${current.selected.skills.join(", ") || "none"}`);
      lines.push("");
      lines.push(`Agents (${current.selected.agents.length}): ${current.selected.agents.join(", ") || "none"}`);
      lines.push("");
      lines.push(`Hooks (${current.selected.hooks.length}): ${current.selected.hooks.join(", ") || "none"}`);
      lines.push("");
      lines.push(`Python: ${current.pythonRunner || "auto"}`);
      lines.push("");
      lines.push(dim("Press Enter to apply, or use ←/→ to keep editing."));
      if (state.message) {
        lines.push("");
        lines.push(state.message);
      }
      paint(lines);
      return;
    }

    const available = tab.available;
    const defaults = new Set(tab.defaults);
    const chosen = tab.key === "target"
      ? new Set([path.resolve(current.target)])
      : tab.key === "python"
        ? new Set([current.pythonRunner || "auto"])
        : selectedSet(tab.key);
    const listHeight = Math.max(6, height - 12);
    const cursor = Math.min(state.cursor[tab.key] ?? 0, Math.max(available.length - 1, 0));
    state.cursor[tab.key] = cursor;
    if (cursor < state.scroll[tab.key]) state.scroll[tab.key] = cursor;
    if (cursor >= state.scroll[tab.key] + listHeight) state.scroll[tab.key] = cursor - listHeight + 1;
    const start = state.scroll[tab.key] ?? 0;
    const end = Math.min(start + listHeight, available.length);

    for (let index = start; index < end; index += 1) {
      const item = available[index];
      const pointer = index === cursor ? ">" : " ";
      const itemValue = tab.key === "python" ? item.value : item;
      const checked = chosen.has(path.resolve(itemValue)) || chosen.has(itemValue) ? "x" : " ";
      const recommended = defaults.has(itemValue) ? "*" : " ";
      const label = tab.key === "target" ? formatTargetLabel(item) : tab.key === "python" ? `${item.label} -> ${item.value}` : item;
      const line = `${pointer} [${checked}]${recommended} ${String(index + 1).padStart(2, " ")}. ${label}`;
      lines.push(index === cursor ? inverse(truncate(line, width)) : truncate(line, width));
    }

    if (available.length > end) lines.push(dim(`... ${available.length - end} more`));
    lines.push("");
    lines.push(dim((tab.key === "target" ? "* = initial target. " : tab.key === "python" ? "* = selected default. " : "* = recommended. ") + "Current tab: " + tab.label));
    if (state.message) lines.push(state.message);
    paint(lines);
  };

  const moveCursor = (delta) => {
    const tab = tabs[state.activeTab];
    if (tab.key === "review") return;
    const max = Math.max(tab.available.length - 1, 0);
    state.cursor[tab.key] = Math.max(0, Math.min(max, (state.cursor[tab.key] ?? 0) + delta));
  };

  const chooseTarget = async () => {
    const target = targetChoices[state.cursor.target ?? 0];
    if (!target || path.resolve(target) === path.resolve(current.target)) {
      state.message = "Target unchanged.";
      render();
      return;
    }
    state.busy = true;
    state.message = `Scanning ${formatTargetLabel(target)}...`;
    render();
    try {
      current = await planTarget(target, args, availableSkills, availableAgents, availableHooks);
      refreshTabsFromCurrent();
      state.message = `Target changed to ${formatTargetLabel(target)}. Recommendations reset for this project.`;
    } catch (error) {
      state.message = `Target scan failed: ${error.message}`;
    } finally {
      state.busy = false;
      render();
    }
  };

  const toggleCurrent = async () => {
    const tab = tabs[state.activeTab];
    if (tab.key === "review") return;
    if (tab.key === "target") {
      await chooseTarget();
      return;
    }
    if (tab.key === "python") {
      const item = tab.available[state.cursor.python ?? 0];
      if (!item) return;
      current.pythonRunner = item.value;
      state.message = `Python runner: ${item.value}`;
      return;
    }
    const item = tab.available[state.cursor[tab.key] ?? 0];
    if (!item) return;
    const chosen = selectedSet(tab.key);
    if (chosen.has(item)) chosen.delete(item);
    else chosen.add(item);
    setSelected(tab.key, tab.available.filter((entry) => chosen.has(entry)));
    state.message = `${chosen.has(item) ? "Selected" : "Removed"} ${item}`;
  };

  const setCurrentTabSelection = (mode) => {
    const tab = tabs[state.activeTab];
    if (tab.key === "review" || tab.key === "target") return;
    if (tab.key === "python") {
      if (mode === "default") current.pythonRunner = tab.defaults[0] || "auto";
      if (mode === "none") current.pythonRunner = "auto";
      if (mode === "all") current.pythonRunner = tab.available.find((choice) => choice.value !== "auto")?.value || "auto";
      state.message = `Python: ${current.pythonRunner}`;
      return;
    }
    if (mode === "all") setSelected(tab.key, [...tab.available]);
    if (mode === "none") setSelected(tab.key, []);
    if (mode === "default") setSelected(tab.key, [...tab.defaults]);
    state.message = `${tab.label}: ${mode}`;
  };

  return new Promise((resolve, reject) => {
    const cleanup = () => {
      input.off("keypress", onKeypress);
      if (input.isTTY) input.setRawMode(false);
      input.pause();
      leaveScreen();
    };

    const finish = async () => {
      cleanup();
      try {
        resolve(await refreshPlannedActions(current, args));
      } catch (error) {
        reject(error);
      }
    };

    const cancel = () => {
      cleanup();
      reject(new Error("Cancelled."));
    };

    const onKeypress = (_str, key = {}) => {
      if (state.busy) return;
      if (key.ctrl && key.name === "c") return cancel();
      if (key.name === "q" || key.name === "escape") return cancel();
      if (key.name === "return" || key.name === "enter") return finish();
      if (key.name === "right" || key.name === "tab") state.activeTab = (state.activeTab + 1) % tabs.length;
      else if (key.name === "left") state.activeTab = (state.activeTab - 1 + tabs.length) % tabs.length;
      else if (key.name === "down") moveCursor(1);
      else if (key.name === "up") moveCursor(-1);
      else if (key.name === "space") void toggleCurrent();
      else if (key.name === "a") setCurrentTabSelection("all");
      else if (key.name === "n") setCurrentTabSelection("none");
      else if (key.name === "d") setCurrentTabSelection("default");
      render();
    };

    readline.emitKeypressEvents(input);
    enterScreen();
    input.setRawMode(true);
    input.resume();
    input.on("keypress", onKeypress);
    render();
  });
}

async function main() {
  let args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(usage());
    return;
  }
  args = await loadConfig(args);

  const availableSkills = await listSkillNames();
  const availableAgents = await listAgentNames();
  const availableHooks = await listHookNames();

  if (args.list) {
    console.log(`Skills (${availableSkills.length}): ${availableSkills.join(", ")}`);
    console.log(`Agents (${availableAgents.length}): ${availableAgents.join(", ")}`);
    console.log(`Hooks  (${availableHooks.length}): ${availableHooks.join(", ")}`);
    return;
  }

  if (Number.isNaN(args.projectDepth) || args.projectDepth < 1) {
    throw new Error("--project-depth must be a positive integer");
  }

  if (args.interactive && args.allProjects) {
    throw new Error("--interactive is root/project-only. Use --target . instead of --all-projects.");
  }

  if (args.repairHookWrappers && args.allProjects) {
    throw new Error("--repair-hook-wrappers currently supports one --target project at a time.");
  }

  if (!args.allProjects && !args.dryRun && !args.suggestOnly && !args.yes) {
    args.interactive = true;
  }

  if (args.allProjects) {
    const root = path.resolve(String(args.projectsRoot ?? args.target ?? process.cwd()));
    if (!(await pathExists(root))) throw new Error(`Projects root does not exist: ${root}`);

    const targets = await findProjects(root, {
      maxDepth: args.projectDepth,
      includeRoot: args.includeRoot,
    });

    if (targets.length === 0) {
      console.log(`No project roots found under ${root}.`);
      console.log("Use --project-depth to scan deeper, or --include-root if the root itself is the project.");
      return;
    }

    const results = [];
    const childApplyOptions = {
      skipPlanTemplates: true,
      planTemplatesRoot: root,
    };
    for (const target of targets) {
      results.push(await planTarget(target, args, availableSkills, availableAgents, availableHooks, childApplyOptions));
    }
    const rootPlanActions = await copyRootPlanTemplates(root, { dryRun: true, force: args.force });

    printBatchSummary({
      root,
      results,
      dryRun: args.dryRun || args.suggestOnly,
      verbose: args.verbose,
      details: args.details,
    });
    if (args.details || args.verbose) {
      console.log(`\nRoot plan template actions (${rootPlanActions.length}):`);
      for (const action of rootPlanActions) console.log(`  - ${action}`);
    }

    if (args.suggestOnly) {
      console.log("\nSuggestion only. Re-run without --suggest-only to install.");
      return;
    }

    if (args.dryRun) return;
    await confirmIfNeeded(args);

    const appliedRootPlanActions = await copyRootPlanTemplates(root, { dryRun: false, force: args.force });
    console.log(`Applied root plan templates: ${appliedRootPlanActions.length} actions`);

    let appliedCount = 0;
    for (const result of results) {
      const applied = await applyPlannedTarget(result, args, childApplyOptions);
      appliedCount += applied.actions.length;
      console.log(`Applied ${path.relative(root, result.target) || "."}: ${applied.actions.length} actions`);
    }
    console.log(`\nApplied Codex kit to ${results.length} project(s): ${appliedCount} child actions, ${appliedRootPlanActions.length} root plan-template actions.`);
    console.log("Next: restart Codex in each target project so new skills, agents, and hooks are loaded.");
    return;
  }

  if (!args.target) args.target = ".";
  const target = path.resolve(String(args.target));
  if (!(await pathExists(target))) throw new Error(`Target does not exist: ${target}`);

  if (args.repairHookWrappers) {
    const actions = await repairHookWrappers(target, { dryRun: args.dryRun });
    const mode = args.dryRun ? "Would refresh" : "Refreshed";
    console.log(`${mode} ${actions.length} Codex hook wrapper(s) in ${path.join(target, ".codex", "hooks")}.`);
    if (actions.length > 0) console.log("Next: restart Codex in this project so repaired hooks are loaded.");
    return;
  }

  let planned = await planTarget(target, args, availableSkills, availableAgents, availableHooks);
  if (args.interactive) {
    planned = await interactiveCustomize(planned, args, availableSkills, availableAgents, availableHooks);
    args.yes = true;
  }

  if (args.suggestOnly) {
    printSummary({ ...planned, actions: [], dryRun: true, details: true });
    console.log("\nSuggestion only. Re-run without --suggest-only to install.");
    return;
  }

  printSummary({ ...planned, dryRun: args.dryRun, details: true, showActions: !args.interactive });

  if (args.dryRun) return;
  await confirmIfNeeded(args);

  const applied = await applyPlannedTarget(planned, args);
  console.log(`\nApplied Codex kit: ${applied.actions.length} actions.`);
  console.log("Next: restart Codex in the target project so new skills, agents, and hooks are loaded.");
}

main().catch((error) => {
  console.error(`\nError: ${error.message}`);
  console.error("\n" + usage());
  process.exitCode = 1;
});
