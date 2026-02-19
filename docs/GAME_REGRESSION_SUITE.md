# Game Regression Suite

> Last updated: 2026-02-18

## Overview

The game regression suite runs deterministic full-game simulations of the Elam board game engine. By replacing `Math.random` with a seeded LCG, every test run produces identical bot decisions, making failures reproducible.

## Test Files

| File | Tests | Purpose |
|------|-------|---------|
| `test/engine-simulation.test.js` | 10 | Full-game simulations with invariant checks |
| `test/engine.test.js` | 35 | Unit tests for engine functions |
| `test/ai-policy.test.js` | 8 | AI bot decision tests |

## Running

```bash
cd C:\AI\Triarch

# Run simulation tests only
node --test test/engine-simulation.test.js

# Run all Triarch unit tests
node --test test/engine.test.js test/ai-policy.test.js test/engine-simulation.test.js

# Run sync check (human-readable)
node scripts/check-sync.mjs

# Run sync check (JSON for CI)
node scripts/check-sync.mjs --json
```

## Simulation Tests

| # | Test | What It Validates |
|---|------|-------------------|
| 1 | 2-player game completes | Game reaches `gameOver` within 500 actions |
| 2 | 3-player game completes | Same for 3 players |
| 3 | 4-player game completes | Same for 4 players |
| 4 | No invalid state | Board dimensions, flag tracking, player index valid at every step |
| 5 | Legal actions non-empty | `enumerateLegalActions` never returns [] during play phase |
| 6 | Legal actions accepted | Every action from `enumerateLegalActions` is accepted by `applyAction` |
| 7 | Flag always trackable | Flag is always locatable (zone unclaimed, carried on board, or carried in zone) |
| 8 | Win on opposite edge | Winner's flag carrier reached the opposite edge |
| 9 | Monotonic counters | `turnCount` and `actionCount` never decrease |
| 10 | No runaway games | 5 different seeds, all complete within 500 actions |

## Invariants Checked

- Board is always 8x8
- `state.current` is always a valid player index
- `turnCount` is non-negative
- Flag carrier (if any) exists on the board or in the zone
- Win message matches expected pattern

## Sync Check

The enhanced sync checker (`scripts/check-sync.mjs`) verifies:

- `main.js` matches `BasilBoardGamesWebsite/public/games/elam/main.js`
- `online-client.js` matches its Basil copy (optional, skipped if not present)

It outputs structured JSON with `--json` for CI integration:

```json
{
  "timestamp": "2026-02-18T...",
  "allPassed": true,
  "results": [
    { "file": "main.js", "status": "ok", "lines": 1234 },
    { "file": "online-client.js", "status": "ok", "lines": 567 }
  ]
}
```

## Seeds

Simulation tests use fixed seeds for reproducibility:

| Test | Seed(s) |
|------|---------|
| 2-player | 42 |
| 3-player | 123 |
| 4-player | 7777 |
| Invariants | 999 |
| Legal non-empty | 314 |
| Legal accepted | 555 |
| Flag tracking | 2024 |
| Win check | 42 |
| Monotonic | 808 |
| Multi-seed | 1, 22, 333, 4444, 55555 |
