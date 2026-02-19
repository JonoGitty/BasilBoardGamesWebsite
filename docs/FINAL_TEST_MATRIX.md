# Final Test Matrix & Project Report

> Generated: 2026-02-18

---

## Coverage Matrix: Before vs After

### Before (pre-implementation baseline)

| Surface | Repo | Test Files | Tests | Coverage |
|---------|------|-----------|-------|----------|
| Services (8) | Basil | 7 | 111 | 7/8 services tested |
| Components (22) | Basil | 0 | 0 | 0% |
| Hooks (11) | Basil | 1 | 3 | 1/11 tested |
| Edge functions (4) | Basil | 0 | 0 | 0% — no contract tests |
| Migrations (17) | Basil | 0 | 0 | 0% — no schema tests |
| Lib (7) | Basil | 3 | 13 | 3/7 tested |
| Utils (8) | Basil | 4 | 32 | 4/8 tested |
| Data (4) | Basil | 2 | 10 | 2/4 tested |
| Analytics (6) | Basil | 2 | 12 | 2/6 tested |
| engine.js (13 exports) | Triarch | 0 | 0 | 0% |
| ai-policy.js (3 exports) | Triarch | 0 | 0 | 0% |
| server.js (17 endpoints) | Triarch | 0 | 0 | 0% |
| **Total** | — | **19** | **111** | — |

### After (current state)

| Surface | Repo | Test Files | Tests | Coverage | Delta |
|---------|------|-----------|-------|----------|-------|
| Services (8) | Basil | 7 | 41 | 7/8 tested | — |
| Components (22) | Basil | 0 (5 E2E specs written) | 18 E2E | Pending live env | +18 specs |
| Hooks (11) | Basil | 1 | 3 | 1/11 tested | — |
| Edge functions (4) | Basil | 2 | 43 | **2/4 contract-tested** | **+43** |
| Schema/types | Basil | 1 | 10 | **Types validated** | **+10** |
| Lib (7) | Basil | 3 | 13 | 3/7 tested | — |
| Utils (8) | Basil | 4 | 32 | 4/8 tested | — |
| Data (4) | Basil | 2 | 10 | 2/4 tested | — |
| Analytics (6) | Basil | 2 | 12 | 2/6 tested | — |
| engine.js (13 exports) | Triarch | 1 | 35 | **100% exports** | **+35** |
| ai-policy.js (3 exports) | Triarch | 1 | 8 | **100% exports** | **+8** |
| Game simulations | Triarch | 1 | 10 | **Full-game coverage** | **+10** |
| **Total** | — | **25 + 5 E2E** | **217 + 18 E2E** | — | **+124** |

### Net Change

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Automated test files | 19 | 25 (+5 E2E) | +32% |
| Automated test cases | 111 | 217 (+18 E2E pending) | +95% |
| Engine coverage | 0 tests | 53 tests (unit + simulation) | 0% -> 100% |
| Edge function contract coverage | 0 tests | 43 tests | 0% -> 50% (2/4) |
| CI pipeline stages | 4 (lint, typecheck, test, build) | 7 (+ contract, regression, audits) | +75% |
| Failure diagnosis | Manual | Automated (22 error codes) | New |
| Production monitoring | None | Synthetic daily probes | New |

---

## Current Test Inventory

### BasilBoardGamesWebsite — 164 passing tests

| File | Tests | Category |
|------|-------|----------|
| src/services/feedbackService.test.ts | 8 | Unit |
| src/services/adminApi.test.ts | 9 | Unit |
| src/services/gameCatalogApi.test.ts | 7 | Unit |
| src/services/profileSync.test.ts | 8 | Unit |
| src/services/sessionTracker.test.ts | 6 | Unit |
| src/services/metricsApi.test.ts | 2 | Unit |
| src/services/postsFeedApi.test.ts | 1 | Unit |
| src/hooks/useAdmin.test.ts | 3 | Unit |
| src/lib/elamUrl.test.ts | 2 | Unit |
| src/lib/authRedirect.test.ts | 4 | Unit |
| src/lib/consent.test.ts | 7 | Unit |
| src/utils/format.test.ts | 7 | Unit |
| src/utils/date.test.ts | 3 | Unit |
| src/utils/nickname.test.ts | 15 | Unit |
| src/utils/seededRandom.test.ts | 7 | Unit |
| src/data/games.test.ts | 6 | Unit |
| src/data/whatsNew.test.ts | 4 | Unit |
| src/analytics/track.test.ts | 8 | Unit |
| src/analytics/transport.test.ts | 4 | Unit |
| tests/contracts/admin-command.contract.test.ts | 31 | Contract |
| tests/contracts/feedback-ingest.contract.test.ts | 12 | Contract |
| tests/contracts/schema.contract.test.ts | 10 | Contract |

### BasilBoardGamesWebsite — 18 E2E specs (pending live environment)

| File | Tests | Requires |
|------|-------|----------|
| tests/e2e/auth.spec.ts | 5 | Supabase + test credentials |
| tests/e2e/admin-posts.spec.ts | 4 | Admin credentials |
| tests/e2e/admin-feedback.spec.ts | 4 | Admin credentials |
| tests/e2e/whats-new.spec.ts | 2 | Running dev server |
| tests/e2e/game-launch.spec.ts | 3 | Running dev server |

### Triarch — 53 passing tests

| File | Tests | Category |
|------|-------|----------|
| test/engine.test.js | 35 | Unit |
| test/ai-policy.test.js | 8 | Unit |
| test/engine-simulation.test.js | 10 | Simulation |

### Triarch — 5 pre-existing E2E

| File | Tests | Requires |
|------|-------|----------|
| e2e/elam-regression.spec.js | 5 | Static server on :3917 |

---

## Remaining Risks

### High Risk (no automated coverage yet)

| Surface | Risk | Impact | Mitigation |
|---------|------|--------|------------|
| 22 React components | No component unit tests | UI regressions slip through | E2E specs provide partial coverage; add component tests next |
| 10 untested hooks | State management bugs | Features silently break | useAdmin tested; prioritize useProfile, useSession next |
| server.js (17 endpoints) | No server integration tests | Online mode regressions | Engine logic tested; add supertest endpoint tests next |
| gameLauncher.ts | Untested service | Game launch failures | Add unit tests (low-hanging fruit) |
| events-ingest, rotation-run edge functions | No contract tests | Silent telemetry/rotation failures | Add contract tests (lower priority) |

### Medium Risk (partially covered)

| Surface | Current Coverage | Gap |
|---------|-----------------|-----|
| Basil E2E flows | 18 specs written, not running | Need test Supabase credentials + Playwright install |
| Component render testing | render-with-providers helper ready | No component tests written yet |
| Migration schema validation | Types validated via schema contract tests | No live DB schema assertion |

### Low Risk (well covered)

| Surface | Coverage |
|---------|----------|
| engine.js game logic | 35 unit tests + 10 simulations = full coverage |
| ai-policy.js bot decisions | 8 tests + determinism verification |
| Edge function API contracts | 43 tests (admin-command + feedback-ingest) |
| TypeScript type safety | Full `tsc --noEmit` gate in CI |
| Code style | ESLint gate in CI |
| File sync (Triarch ↔ Basil) | Automated check in CI |

---

## Automation Status

### Fully Automated (runs on every PR)

| What | How | Where |
|------|-----|-------|
| Linting | ESLint | full-quality-gate Stage 1 |
| Type checking | `tsc --noEmit` | full-quality-gate Stage 1 |
| 164 Basil unit + contract tests | Vitest | full-quality-gate Stages 2-3 |
| 53 Triarch unit + simulation tests | `node:test` | full-quality-gate Stage 5 |
| V8 code coverage | @vitest/coverage-v8 | Artifact upload |
| Failure classification | diagnostics engine | Artifact on failure |
| File sync check | check-sync.mjs | full-quality-gate Stage 5 |
| Production build | Vite | full-quality-gate Stage 7 |
| Security audit | security-audit.mjs | full-quality-gate Stage 6 |
| Privacy drift check | privacy-drift-check.mjs | full-quality-gate Stage 6 |

### Automated but Conditional

| What | Condition | How to Enable |
|------|-----------|---------------|
| Basil E2E (18 tests) | `E2E_ENABLED=true` repo variable | Set test Supabase credentials as secrets |
| Triarch E2E (5 tests) | `TRIARCH_E2E_ENABLED=true` | Set repo variable |
| Synthetic production probes | Scheduled daily 8am UTC | Runs automatically via cron |

### Still Manual

| What | Frequency | How |
|------|-----------|-----|
| Component render tests | When adding components | Write test using render-with-providers |
| Live contract tests (real Supabase) | Before major releases | Set `LIVE_CONTRACT_TESTS=1` + service role key |
| Server endpoint integration tests | Not yet implemented | Would need supertest or similar |
| Visual regression testing | Not implemented | Would need Playwright screenshot comparison |
| Load/performance testing | Not implemented | Would need k6 or similar |

---

## Recommended Maintenance Cadence

### Weekly

| Task | Command | Purpose |
|------|---------|---------|
| Review synthetic monitor results | Check GitHub Actions > Synthetic Monitor | Catch endpoint drift |
| Check CI pass rate | Review last 7 days of quality gate runs | Spot flaky tests |
| Review coverage trend | Compare coverage artifacts week-over-week | Prevent coverage erosion |

### Monthly

| Task | Command | Purpose |
|------|---------|---------|
| Update dependencies | `npm outdated && npm update` | Security patches, breaking changes |
| Run security audit manually | `npm run audit:security` | Catch new vulnerabilities |
| Review diagnostics rules | Check `diagnostics/rules/*.json` | Add new failure patterns discovered |
| Update fixture factories | Review `supabase-rows.ts` | Keep in sync with schema changes |
| Check E2E test health | Run `npx playwright test` locally | Verify selectors still match UI |

### Quarterly

| Task | Purpose |
|------|---------|
| Review RISK_MATRIX.md | Re-assess priorities as coverage grows |
| Review INCIDENT_RESPONSE_PLAYBOOK.md | Update with lessons from real incidents |
| Evaluate adding component tests | Highest-impact untested surface |
| Evaluate server endpoint tests | Online mode reliability |
| Update error catalog | Add new error patterns from production |

### On Schema/API Changes

| When | Do |
|------|-----|
| New Supabase migration added | Update schema contract tests + fixture factories |
| Edge function API changed | Update contract tests (admin-command or feedback-ingest) |
| New component added | Consider adding to E2E spec |
| Engine.js logic changed | Run `npm run test:unit` in Triarch, check simulation tests |
| New bot profile added | Add weight key assertion in ai-policy.test.js |

---

## Quality Gate Workflow Reference

See `docs/QUALITY_GATES.md` for:
- Full pipeline stage diagram
- Branch protection configuration
- Failure artifact details
- Local reproduction commands

See `docs/INCIDENT_RESPONSE_PLAYBOOK.md` for:
- Severity classification (P0-P3)
- Scenario-specific playbooks
- Error catalog quick reference
- Post-incident procedures

---

## Infrastructure Inventory

### Files Created

| Path | Purpose |
|------|---------|
| `.github/workflows/full-quality-gate.yml` | Unified 7-stage CI pipeline |
| `.github/workflows/ci.yml` | Existing CI (now superseded by full-quality-gate) |
| `.github/workflows/synthetic-monitor.yml` | Daily production endpoint probing |
| `tests/contracts/admin-command.contract.test.ts` | 31 admin API shape tests |
| `tests/contracts/feedback-ingest.contract.test.ts` | 12 feedback API shape tests |
| `tests/contracts/schema.contract.test.ts` | 10 type validation tests |
| `tests/e2e/auth.spec.ts` | 5 auth E2E tests |
| `tests/e2e/admin-posts.spec.ts` | 4 admin posts E2E tests |
| `tests/e2e/admin-feedback.spec.ts` | 4 admin feedback E2E tests |
| `tests/e2e/whats-new.spec.ts` | 2 feed E2E tests |
| `tests/e2e/game-launch.spec.ts` | 3 game launch E2E tests |
| `playwright.config.ts` | Playwright configuration |
| `src/test/fixtures/supabase-rows.ts` | TypeScript fixture factories |
| `src/test/helpers/mock-supabase.ts` | Supabase mock helpers |
| `src/test/helpers/render-with-providers.tsx` | Component test wrapper |
| `scripts/test/setup-env.mjs` | Test environment validation |
| `scripts/test/reset-state.mjs` | Test state reset |
| `scripts/test/seed-fixtures.mjs` | Fixture seeding |
| `scripts/diagnostics/analyze-failure.mjs` | Failure classifier |
| `scripts/diagnostics/ci-failure-report.mjs` | CI failure reporter |
| `scripts/monitor/synthetic-checks.mjs` | Synthetic endpoint monitor |
| `scripts/monitor/endpoint-manifest.json` | Endpoint probe manifest |
| `diagnostics/error-catalog.json` | 22 error codes |
| `diagnostics/rules/network.json` | Network failure patterns |
| `diagnostics/rules/auth.json` | Auth failure patterns |
| `diagnostics/rules/game-logic.json` | Game logic failure patterns |
| `diagnostics/rules/render.json` | Render failure patterns |
| `diagnostics/rules/config.json` | Config failure patterns |
| `diagnostics/rules/data.json` | Data failure patterns |
| `docs/TEST_INVENTORY.md` | Full testable surface inventory |
| `docs/RISK_MATRIX.md` | Severity/owner/automation matrix |
| `docs/CRITICAL_USER_JOURNEYS.md` | 12 user journey specs |
| `docs/TEST_ENV_SETUP.md` | Test environment setup guide |
| `docs/CONTRACT_TESTS.md` | Contract test documentation |
| `docs/E2E_RUNBOOK.md` | E2E test setup and run guide |
| `docs/GAME_REGRESSION_SUITE.md` | Simulation test documentation |
| `docs/ERROR_TAXONOMY.md` | Error classification guide |
| `docs/SYNTHETIC_MONITORING.md` | Monitoring documentation |
| `docs/QUALITY_GATES.md` | CI gates and branch protection |
| `docs/INCIDENT_RESPONSE_PLAYBOOK.md` | Incident response procedures |

### Triarch Files Created

| Path | Purpose |
|------|---------|
| `.github/workflows/ci.yml` | Triarch CI pipeline |
| `test/engine.test.js` | 35 engine unit tests |
| `test/ai-policy.test.js` | 8 AI policy tests |
| `test/engine-simulation.test.js` | 10 full-game simulation tests |
| `test/helpers/engine-fixtures.js` | Engine test fixtures |
| `test/helpers/server-fixtures.js` | Server API payload fixtures |
| `scripts/check-sync.mjs` | Enhanced sync checker with JSON output |

### Files Modified

| Path | Change |
|------|--------|
| `vitest.config.ts` | Added E2E exclude, v8 coverage config |
| `package.json` | Added `test:coverage` script, `@vitest/coverage-v8` |
| `.github/workflows/ci.yml` | Added coverage, failure diagnosis, artifacts |
| `.github/workflows/security-privacy-audit.yml` | Added Triarch unit tests |
| `Triarch/package.json` | Added `test:unit` script |
