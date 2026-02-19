# Incident Response Playbook

> Last updated: 2026-02-18

## Quick Reference

| Severity | Response Time | Who Acts | Escalation |
|----------|--------------|----------|------------|
| P0 — Site down | Immediate | Owner | Check deploy, revert last commit |
| P1 — Feature broken | < 1 hour | Owner | Diagnose via artifacts, hotfix PR |
| P2 — Test regression | < 4 hours | Owner | Fix in next PR, do not merge broken |
| P3 — Advisory warning | Next sprint | Owner | Track in issue, fix when convenient |

---

## Triage Flow

```
CI Failure Detected
       │
       ▼
 Download failure artifacts
       │
       ▼
 Run diagnostics classifier:
   cat failure-output.txt | node scripts/diagnostics/analyze-failure.mjs
       │
       ▼
 Classify by error code ──→ See Error Catalog below
       │
       ▼
 Apply remediation ──→ Test locally ──→ Push fix
```

---

## Scenario Playbooks

### 1. Production Site Down (P0)

**Symptoms:** Synthetic monitor fails, users report blank page.

**Steps:**
1. Check synthetic monitor results: `node scripts/monitor/synthetic-checks.mjs`
2. Verify GitHub Pages deployment status at repo > Actions > Deploy
3. Check if last deploy succeeded — if not, the previous version is still live
4. If the last deploy broke the site:
   ```bash
   git log --oneline -5              # Find last good commit
   git revert HEAD                   # Revert the bad commit
   git push                          # Triggers redeploy
   ```
5. If GitHub Pages is down (not your fault), wait and monitor
6. If Supabase edge functions are down, check [status.supabase.com](https://status.supabase.com)

**Verification:** `curl -s https://basilboardgames.co.uk | grep -q "Basil" && echo OK`

---

### 2. Unit Tests Failing in CI (P2)

**Symptoms:** `Stage 2: Unit tests` is red.

**Steps:**
1. Download `basil-unit-failure-report` artifact from the failed run
2. Read the markdown report — it classifies each failure with an error code
3. Common causes:

| Error Code | Likely Cause | Fix |
|-----------|-------------|-----|
| `CONFIG_IMPORT_FAILED` | Missing dependency or broken import path | `npm ci`, check tsconfig |
| `RENDER_COMPONENT_CRASH` | Null access in component | Check prop types, add guards |
| `NET_FETCH_FAILED` | Mock not set up | Check mock-supabase helper |
| `DATA_SCHEMA_MISMATCH` | Type changed without updating fixture | Update supabase-rows.ts |

4. Reproduce locally: `npm run test:coverage`
5. Fix, commit, push

---

### 3. Contract Tests Failing (P2)

**Symptoms:** `Stage 3: Contract tests` is red.

**Steps:**
1. Download `basil-contract-failure-report` artifact
2. Contract test failures mean the **API shape changed**:
   - If intentional: update the contract test to match the new shape
   - If unintentional: revert the API change
3. Check which file failed:

| File | What Changed | Action |
|------|-------------|--------|
| admin-command.contract.test.ts | Command names, args shape, response shape | Update test OR revert edge function |
| feedback-ingest.contract.test.ts | Payload/response fields | Update test OR revert |
| schema.contract.test.ts | TypeScript types diverged from fixtures | Update supabase-rows.ts factories |

4. Reproduce: `npx vitest run tests/contracts/`

---

### 4. Game Engine Regression (P1)

**Symptoms:** `Stage 5: Game regression` is red — engine/AI/simulation tests failing.

**Steps:**
1. This is **critical** — means game logic is broken for all players
2. Identify which test suite failed:

| Suite | Impact | Likely Cause |
|-------|--------|-------------|
| engine.test.js | Core mechanics broken | Changed engine.js exports or logic |
| ai-policy.test.js | Bots freeze or make illegal moves | Changed AI weights or scoring |
| engine-simulation.test.js | Full games don't complete | Subtle logic bug causing infinite loops |

3. Reproduce locally:
   ```bash
   cd C:\AI\Triarch
   node --test test/engine.test.js
   node --test test/ai-policy.test.js
   node --test test/engine-simulation.test.js
   ```
4. If simulation tests fail but unit tests pass, the bug is likely in an edge case the simulation hits via seeded random
5. **Do not deploy** until engine tests pass

---

### 5. File Sync Divergence (P2)

**Symptoms:** Sync check reports `FAIL` for main.js.

**Steps:**
1. Download `triarch-sync-results` artifact or run locally:
   ```bash
   cd C:\AI\Triarch && node scripts/check-sync.mjs
   ```
2. The report shows the first divergence line
3. Determine which copy is authoritative (usually Triarch is source of truth)
4. Copy the authoritative version:
   ```bash
   cp C:\AI\Triarch\main.js C:\AI\BasilBoardGamesWebsite\public\games\elam\main.js
   ```
5. Commit to both repos

---

### 6. E2E Tests Failing (P2)

**Symptoms:** `Stage 4: E2E tests` is red.

**Steps:**
1. Download `basil-e2e-artifacts` — contains screenshots and Playwright traces
2. Open `playwright-report/index.html` to see visual test results
3. Common causes:
   - **Selector changed:** Component markup updated, test selectors are stale
   - **Supabase down:** Test credentials expired or service unavailable
   - **Timing:** Add `await page.waitForSelector()` or increase timeout
4. E2E failures are **advisory** by default — they don't block merging
5. Fix when possible, but don't let them block urgent deploys

---

### 7. Security/Privacy Audit Warning (P3)

**Symptoms:** Audit jobs show warnings or failures.

**Steps:**
1. Download audit artifact (`security-audit-report` or `privacy-drift-report`)
2. Review the report for new findings
3. Audits are **advisory** — they don't block merging
4. Track significant findings as GitHub issues
5. Address in the next sprint

---

### 8. Build Failure (P1)

**Symptoms:** `Stage 7: Production build` is red but tests pass.

**Steps:**
1. Usually means TypeScript compilation succeeds in `--noEmit` mode but fails with `--build`
2. Common causes:
   - Import only used as type but not marked with `type` keyword
   - Vite plugin configuration issue
   - Asset reference to missing file
3. Reproduce: `npm run build`
4. **Do not merge** until build passes

---

## Diagnostics Tools

### Failure Classifier
Pipe any test output through the classifier:
```bash
npx vitest run 2>&1 | node scripts/diagnostics/analyze-failure.mjs
```

Output: JSON with classified failures, error codes, and remediation suggestions.

### CI Report Generator
Produces both markdown and JSON:
```bash
npx vitest run 2>&1 | node scripts/diagnostics/ci-failure-report.mjs
```

Writes `diagnostics/last-report.json` and prints markdown to stdout.

### Synthetic Monitor
Probe production endpoints:
```bash
node scripts/monitor/synthetic-checks.mjs         # Human-readable
node scripts/monitor/synthetic-checks.mjs --json   # JSON
```

---

## Error Catalog Quick Reference

| Code | Category | Meaning |
|------|----------|---------|
| `NET_FETCH_FAILED` | Network | fetch/ECONNREFUSED |
| `NET_CORS_BLOCKED` | Network | CORS policy violation |
| `NET_TIMEOUT` | Network | Request timed out |
| `NET_429_RATE_LIMIT` | Network | Rate limited |
| `AUTH_SESSION_EXPIRED` | Auth | Token expired |
| `AUTH_MISSING_TOKEN` | Auth | No auth header |
| `AUTH_UNAUTHORIZED` | Auth | Insufficient role |
| `GAME_INVALID_ACTION` | Game | Engine rejected action |
| `GAME_BOT_FREEZE` | Game | Bot returned null |
| `RENDER_COMPONENT_CRASH` | Render | TypeError in render |
| `RENDER_MISSING_ELEMENT` | Render | DOM element not found |
| `CONFIG_ENV_MISSING` | Config | Env var not set |
| `CONFIG_IMPORT_FAILED` | Config | Module not found |
| `DATA_SCHEMA_MISMATCH` | Data | Shape doesn't match type |
| `DATA_DUPLICATE_KEY` | Data | Unique constraint |

Full catalog: `diagnostics/error-catalog.json`

---

## Post-Incident

After resolving any P0 or P1 incident:

1. Verify the fix passes all CI stages
2. If a new failure pattern was discovered, add it to `diagnostics/rules/*.json`
3. If the existing tests didn't catch the bug, add a regression test
4. Update this playbook if the incident revealed a gap
