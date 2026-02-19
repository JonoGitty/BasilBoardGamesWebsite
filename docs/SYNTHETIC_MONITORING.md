# Synthetic Monitoring

> Last updated: 2026-02-18

## Overview

Synthetic monitors probe production endpoints daily to verify availability. All probes are safe, read-only operations that don't modify state.

## Endpoints Monitored

| Name | URL | Method | Expected |
|------|-----|--------|----------|
| Homepage | basilboardgames.co.uk | GET | 200, body contains "Basil" |
| Elam game page | basilboardgames.co.uk/games/elam/ | GET | 200 |
| Feedback CORS | Supabase feedback-ingest | OPTIONS | 200 or 204 |
| Admin command | Supabase admin-command | POST `{}` | 401 or 400 (unauthenticated) |

## Running Locally

```bash
# Human-readable output
node scripts/monitor/synthetic-checks.mjs

# JSON output
node scripts/monitor/synthetic-checks.mjs --json

# With Supabase URL
SUPABASE_URL=https://your-project.supabase.co node scripts/monitor/synthetic-checks.mjs
```

## CI Schedule

The synthetic monitor runs via GitHub Actions (`.github/workflows/synthetic-monitor.yml`):
- **Schedule:** Daily at 8:00 AM UTC
- **Manual trigger:** Available via `workflow_dispatch`
- **Artifacts:** Results JSON uploaded with 30-day retention

## Configuration

Edit `scripts/monitor/endpoint-manifest.json` to add/remove endpoints.

### Endpoint schema

```json
{
  "name": "Human-readable name",
  "url": "https://example.com or ${SUPABASE_URL}/path",
  "method": "GET|POST|OPTIONS",
  "expect": [200],
  "contains": "optional string to find in response body",
  "timeoutMs": 10000,
  "headers": {},
  "body": "optional request body"
}
```

### Environment variables

| Variable | Description |
|----------|-------------|
| `SUPABASE_URL` | Replaces `${SUPABASE_URL}` in endpoint URLs |
| `VITE_SUPABASE_URL` | Fallback for SUPABASE_URL |
