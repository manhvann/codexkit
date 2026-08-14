#!/usr/bin/env node

const path = require('path');
const {
  grantPrivacyApproval,
  isApprovableTool,
} = require('./lib/privacy-checker.cjs');

function usage() {
  console.error('Usage: node .codex/hooks/privacy-approval.cjs approve --tool <Read|Write|Edit|MultiEdit> --path <sensitive-path> [--ttl <seconds>]');
}

function parseArgs(argv) {
  const args = { command: argv[2] };
  for (let index = 3; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--tool') args.tool = argv[++index];
    else if (value === '--path') args.filePath = argv[++index];
    else if (value === '--ttl') args.ttlSeconds = argv[++index];
    else if (value === '--once') args.once = true;
    else throw new Error(`Unknown argument: ${value}`);
  }
  return args;
}

try {
  const args = parseArgs(process.argv);
  if (args.command !== 'approve' || !args.tool || !args.filePath || !isApprovableTool(args.tool)) {
    usage();
    process.exit(1);
  }

  const grant = grantPrivacyApproval({
    filePath: args.filePath,
    toolName: args.tool,
    ttlSeconds: args.ttlSeconds ?? 300,
    cwd: process.cwd(),
  });
  const relativePath = path.relative(process.cwd(), grant.path) || path.basename(grant.path);
  console.log(`Privacy approval granted once for ${args.tool}: ${relativePath}`);
  console.log(`Expires in ${Math.ceil((grant.expiresAt - Date.now()) / 1000)} seconds.`);
} catch (error) {
  console.error(`Privacy approval failed: ${error.message}`);
  process.exit(1);
}
