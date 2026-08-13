#!/usr/bin/env node
'use strict';

// Config Counter - Count AGENTS.md, rules, MCPs, hooks across user and project scopes

const fs = require('fs');
const path = require('path');
const os = require('os');

function getMcpServerNames(filePath) {
  if (!fs.existsSync(filePath)) return new Set();
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const config = JSON.parse(content);
    if (config.mcpServers && typeof config.mcpServers === 'object') {
      return new Set(Object.keys(config.mcpServers));
    }
  } catch {
    // Silent fail
  }
  return new Set();
}

function countMcpServersInFile(filePath, excludeFrom) {
  const servers = getMcpServerNames(filePath);
  if (excludeFrom) {
    const exclude = getMcpServerNames(excludeFrom);
    for (const name of exclude) {
      servers.delete(name);
    }
  }
  return servers.size;
}

function countHooksInFile(filePath) {
  if (!fs.existsSync(filePath)) return 0;
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const config = JSON.parse(content);
    if (config.hooks && typeof config.hooks === 'object') {
      return Object.keys(config.hooks).length;
    }
  } catch {
    // Silent fail
  }
  return 0;
}

function countRulesInDir(rulesDir, depth = 0) {
  // Depth limit prevents symlink loops and excessive recursion
  if (depth > 5 || !fs.existsSync(rulesDir)) return 0;
  let count = 0;
  try {
    const entries = fs.readdirSync(rulesDir, { withFileTypes: true });
    for (const entry of entries) {
      // Skip symlinks to prevent loops
      if (entry.isSymbolicLink()) continue;
      const fullPath = path.join(rulesDir, entry.name);
      if (entry.isDirectory()) {
        count += countRulesInDir(fullPath, depth + 1);
      } else if (entry.isFile() && entry.name.endsWith('.md')) {
        count++;
      }
    }
  } catch {
    // Silent fail
  }
  return count;
}

function countConfigs(cwd) {
  let codexMdCount = 0, rulesCount = 0, mcpCount = 0, hooksCount = 0;
  const homeDir = os.homedir();
  const codexDir = path.join(homeDir, '.codex');

  // User scope
  if (fs.existsSync(path.join(codexDir, 'AGENTS.md'))) codexMdCount++;
  rulesCount += countRulesInDir(path.join(codexDir, 'rules'));
  const userSettings = path.join(codexDir, 'settings.json');
  mcpCount += countMcpServersInFile(userSettings);
  hooksCount += countHooksInFile(userSettings);
  mcpCount += countMcpServersInFile(path.join(homeDir, '.codex.json'), userSettings);

  // Project scope
  if (cwd) {
    if (fs.existsSync(path.join(cwd, 'AGENTS.md'))) codexMdCount++;
    if (fs.existsSync(path.join(cwd, 'CODEX.local.md'))) codexMdCount++;
    if (fs.existsSync(path.join(cwd, 'AGENTS.md'))) codexMdCount++;
    if (fs.existsSync(path.join(cwd, 'AGENTS.local.md'))) codexMdCount++;
    rulesCount += countRulesInDir(path.join(cwd, '.codex', 'rules'));
    mcpCount += countMcpServersInFile(path.join(cwd, '.mcp.json'));
    const projectSettings = path.join(cwd, '.codex', 'config.toml');
    mcpCount += countMcpServersInFile(projectSettings);
    hooksCount += countHooksInFile(projectSettings);
    const localSettings = path.join(cwd, '.codex', 'hooks.json');
    mcpCount += countMcpServersInFile(localSettings);
    hooksCount += countHooksInFile(localSettings);
  }

  return { codexMdCount, rulesCount, mcpCount, hooksCount };
}

module.exports = { countConfigs, getMcpServerNames, countMcpServersInFile, countHooksInFile, countRulesInDir };
