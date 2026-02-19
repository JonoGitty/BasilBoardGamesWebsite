# Error Taxonomy & Diagnostics Engine

> Last updated: 2026-02-18

## Overview

The diagnostics engine automatically classifies test failures into known error categories using pattern-matching rules. This helps CI quickly surface root causes and remediation steps.

## Architecture

```
diagnostics/
  error-catalog.json          # Master catalog of all known error codes
  rules/
    network.json              # NET_* patterns
    auth.json                 # AUTH_* patterns
    game-logic.json           # GAME_* patterns
    render.json               # RENDER_* patterns
    config.json               # CONFIG_* patterns
    data.json                 # DATA_* patterns
  last-report.json            # Most recent CI failure report (generated)

scripts/diagnostics/
  analyze-failure.mjs         # Reads test output → JSON classification
  ci-failure-report.mjs       # Wraps analyzer → JSON + markdown report
```

## Error Categories

| Category | Prefix | Example Codes |
|----------|--------|---------------|
| Network | `NET_` | NET_FETCH_FAILED, NET_CORS_BLOCKED, NET_TIMEOUT, NET_429_RATE_LIMIT |
| Auth | `AUTH_` | AUTH_SESSION_EXPIRED, AUTH_MISSING_TOKEN, AUTH_UNAUTHORIZED |
| Game Logic | `GAME_` | GAME_INVALID_ACTION, GAME_STATE_DESYNC, GAME_BOT_FREEZE |
| Render | `RENDER_` | RENDER_COMPONENT_CRASH, RENDER_MISSING_ELEMENT |
| Config | `CONFIG_` | CONFIG_ENV_MISSING, CONFIG_IMPORT_FAILED, CONFIG_TYPE_ERROR |
| Data | `DATA_` | DATA_SCHEMA_MISMATCH, DATA_NULL_UNEXPECTED, DATA_DUPLICATE_KEY |

## Usage

### Pipe test output through analyzer

```bash
npx vitest run 2>&1 | node scripts/diagnostics/analyze-failure.mjs
```

Output:
```json
{
  "failures": [
    {
      "test": "feedbackService > submits feedback",
      "category": "network",
      "code": "NET_FETCH_FAILED",
      "confidence": 0.9,
      "suggestion": "Check network connectivity, verify VITE_SUPABASE_URL..."
    }
  ]
}
```

### Generate CI report (JSON + markdown)

```bash
npx vitest run 2>&1 | node scripts/diagnostics/ci-failure-report.mjs
```

Produces `diagnostics/last-report.json` and prints markdown summary to stdout.

### Read from file

```bash
node scripts/diagnostics/analyze-failure.mjs --file test-output.txt
node scripts/diagnostics/ci-failure-report.mjs --file test-output.txt
```

## Adding New Rules

1. Add the error code to `diagnostics/error-catalog.json`
2. Add a pattern rule to the appropriate `diagnostics/rules/*.json` file
3. Test with a sample failure string

### Rule format

```json
{
  "pattern": "regex pattern (case-insensitive)",
  "code": "CATEGORY_ERROR_NAME",
  "confidence": 0.85
}
```

## Confidence Levels

- **0.95+**: Near-certain match (e.g., specific error message)
- **0.85-0.94**: High confidence (e.g., keyword combination)
- **0.70-0.84**: Moderate confidence (may need manual verification)
- **< 0.70**: Low confidence (broad pattern, check manually)
