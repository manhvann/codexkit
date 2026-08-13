# Slack Notification Hook Setup

## Overview

Send Codex notifications to Slack using Block Kit formatted messages.

## Prerequisites

- Slack workspace with permissions to add apps
- Codex installed

## Quick Start

### Step 1: Create Slack App

1. Go to [api.slack.com/apps](https://api.slack.com/apps)
2. Click "Create New App" → "From scratch"
3. Name it (e.g., "Codex Notifications")
4. Select your workspace

### Step 2: Enable Incoming Webhooks

1. In app settings → "Incoming Webhooks"
2. Toggle "Activate Incoming Webhooks" ON
3. Click "Add New Webhook to Workspace"
4. Select channel → "Allow"
5. Copy the webhook URL

### Step 3: Configure Environment

Add to `~/.codex/.env` (global) or `.codex/.env` (project):

```env
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx/yyy/zzz
```

### Step 4: Test

```bash
echo '{"hook_event_name":"Stop","cwd":"'"$(pwd)"'","session_id":"test123"}' | \
  node .codex/hooks/notifications/notify.cjs
```

## Message Format

Notifications use Slack Block Kit with:
- Header showing event type
- Project name, time, session ID
- Location path in context block
- Agent type for SubagentStop events

## Supported Events

| Event | Description |
|-------|-------------|
| Stop | Main session completed |
| SubagentStop | Subagent task completed |
| AskUserPrompt | Codex needs user input |

## Troubleshooting

| Error | Solution |
|-------|----------|
| `invalid_payload` | Check JSON formatting |
| `channel_is_archived` | Webhook's target channel was archived |
| `no_active_hooks` | Webhook was disabled in Slack |
| No notification | Verify SLACK_WEBHOOK_URL is set correctly |

## Multiple Providers

The unified `notify.cjs` routes to all configured providers simultaneously. Set env vars for each provider you want to enable.

## Environment Variable Priority

1. `process.env` (highest)
2. `~/.codex/.env` (global)
3. `.codex/.env` (project, lowest)

## Security Best Practices

1. **Never commit webhook URLs:**
   ```bash
   # .gitignore
   .env
   .env.*
   .env.local
   ```

2. **Use environment variables:** Never hardcode webhooks in scripts

3. **Rotate webhooks regularly:**
   - Delete old webhook in Slack
   - Create new webhook
   - Update configuration

4. **Limit webhook permissions:**
   - Only grant webhook access to necessary channels
   - Use private channels for sensitive notifications

5. **Monitor webhook usage:**
   - Check Slack app analytics regularly
   - Look for unexpected webhook activity

## Reference

**Script Location:** `.codex/hooks/notifications/notify.cjs`

**Configuration File:** `~/.codex/.env` or `.codex/.env`

**Required Environment Variable:** `SLACK_WEBHOOK_URL`

**Slack API Documentation:** https://api.slack.com/messaging/webhooks

**Codex Hooks:** https://github.com/openai/codex

---

**Last Updated:** 2025-12-21
