# Quality Gates

> Last updated: 2026-02-18

## Pipeline Stages

The `full-quality-gate.yml` workflow enforces a strict stage pipeline. Each stage must pass before the next begins (where dependencies exist).

```
Stage 1 (parallel)         Stage 2          Stage 3          Stage 4
  lint ──────────────┐
                     ├──→ unit-tests ──┬──→ contract ──┬──→ e2e-tests
  typecheck ─────────┘                 │               │
                                       │               ├──→ security-audit
  Stage 5 (parallel with 2-3)         │               └──→ privacy-audit
  game-regression ←── lint+typecheck   │
         │                              │        Stage 7
         └──────────────────────────────┴──────→ build
                                                    │
                                            quality-gate-passed
```

### Stage 1: Static Analysis
| Gate | Tool | Blocks | Failure Action |
|------|------|--------|---------------|
| Lint | ESLint | All downstream | Fix lint errors locally: `npm run lint` |
| Typecheck | `tsc --noEmit` | All downstream | Fix type errors: `npm run typecheck` |

### Stage 2: Unit Tests
| Gate | Tool | Tests | Blocks | Failure Action |
|------|------|-------|--------|---------------|
| Unit tests | Vitest + v8 coverage | 164 | contract, e2e, audits, build | Run `npm run test:coverage` locally |

**Artifacts on failure:** Coverage report (always), failure diagnosis report (on failure).

### Stage 3: Contract Tests
| Gate | Tool | Tests | Blocks | Failure Action |
|------|------|-------|--------|---------------|
| Contract tests | Vitest | 53 | e2e, audits, build | Run `npx vitest run tests/contracts/` locally |

Tests validate API shapes for admin-command (31), feedback-ingest (12), and schema (10) without network access.

### Stage 4: E2E Tests
| Gate | Tool | Tests | Blocks | Failure Action |
|------|------|-------|--------|---------------|
| E2E (Basil) | Playwright | 18 | none (advisory) | Inspect screenshots in artifacts |

**Conditional:** Only runs when `E2E_ENABLED=true` or on `workflow_dispatch`. Requires Supabase test credentials.

**Artifacts on failure:** Screenshots, traces, video, Playwright HTML report.

### Stage 5: Game Regression
| Gate | Tool | Tests | Blocks | Failure Action |
|------|------|-------|--------|---------------|
| Syntax check | `node --check` | 4 files | engine/AI/sim tests | Fix syntax errors |
| Engine tests | `node:test` | 35 | build | Run `node --test test/engine.test.js` |
| AI policy tests | `node:test` | 8 | build | Run `node --test test/ai-policy.test.js` |
| Simulation tests | `node:test` | 10 | build | Run `node --test test/engine-simulation.test.js` |
| File sync | check-sync.mjs | 1-2 files | none (warning) | Copy main.js to Basil |

### Stage 6: Audits
| Gate | Tool | Blocks | Failure Action |
|------|------|--------|---------------|
| Security audit | security-audit.mjs | advisory | Review `audit/out/security-audit-report.*` |
| Privacy drift | privacy-drift-check.mjs | advisory | Review `audit/out/privacy-*` |

Audits are **advisory** — they produce warnings but do not block the build.

### Stage 7: Build
| Gate | Tool | Blocks | Failure Action |
|------|------|--------|---------------|
| Production build | `tsc -b && vite build` | deploy | Fix build errors |

---

## Branch Protection Settings

### Recommended GitHub Settings for `master`/`main`

Navigate to **Settings > Branches > Branch protection rules** and configure:

#### Required Status Checks
Enable **"Require status checks to pass before merging"** with these required checks:

| Check Name | Source Workflow | Required? |
|------------|---------------|-----------|
| `Stage 1: Lint` | full-quality-gate | Yes |
| `Stage 1: Typecheck` | full-quality-gate | Yes |
| `Stage 2: Unit tests` | full-quality-gate | Yes |
| `Stage 3: Contract tests` | full-quality-gate | Yes |
| `Stage 5: Game regression` | full-quality-gate | Yes |
| `Stage 7: Production build` | full-quality-gate | Yes |
| `Quality gate passed` | full-quality-gate | Yes |

**Optional (recommended once stable):**
| Check Name | Source Workflow | Required? |
|------------|---------------|-----------|
| `Stage 4: E2E tests (Basil)` | full-quality-gate | When E2E_ENABLED |
| `Stage 6: Security audit` | full-quality-gate | Advisory |
| `Stage 6: Privacy audit` | full-quality-gate | Advisory |

#### Other Recommended Settings
- **Require branches to be up to date before merging:** Yes
- **Require pull request reviews:** 0 (solo project) or 1+ (team)
- **Require conversation resolution:** Yes
- **Include administrators:** Yes (prevents force-push bypasses)
- **Allow force pushes:** No
- **Allow deletions:** No

### Setup Commands (GitHub CLI)

```bash
# Enable branch protection (adjust repo name)
gh api repos/OWNER/BasilBoardGamesWebsite/branches/master/protection \
  --method PUT \
  --field required_status_checks='{"strict":true,"contexts":["Stage 1: Lint","Stage 1: Typecheck","Stage 2: Unit tests","Stage 3: Contract tests","Stage 5: Game regression","Stage 7: Production build","Quality gate passed"]}' \
  --field enforce_admins=true \
  --field required_pull_request_reviews=null \
  --field restrictions=null
```

---

## Failure Artifacts

Every failing stage uploads diagnostic artifacts:

| Stage | Artifact Name | Contents | Retention |
|-------|--------------|----------|-----------|
| Unit tests | `basil-coverage` | HTML/JSON coverage report | 14 days |
| Unit tests | `basil-unit-failure-report` | Classified failure report (MD + JSON) | 30 days |
| Contract tests | `basil-contract-failure-report` | Classified failure report | 30 days |
| E2E (Basil) | `basil-e2e-artifacts` | Screenshots, traces, Playwright report | 14 days |
| E2E (Triarch) | `triarch-e2e-artifacts` | Screenshots, traces | 14 days |
| Game regression | `triarch-sync-results` | Sync check JSON | 14 days |
| Security audit | `security-audit-report` | Full audit report | 30 days |
| Privacy audit | `privacy-drift-report` | Privacy inventory + drift | 30 days |
| Build | `production-build` | Built dist/ output | 7 days |

---

## Running Locally

```bash
# Full CI equivalent
cd C:\AI\BasilBoardGamesWebsite
npm run ci                           # typecheck + lint + test + build

# Individual stages
npm run lint                          # Stage 1a
npm run typecheck                     # Stage 1b
npm run test:coverage                 # Stage 2
npx vitest run tests/contracts/       # Stage 3
npm run build                         # Stage 7

# Triarch (from Triarch repo)
cd C:\AI\Triarch
npm test                              # Syntax check
npm run test:unit                     # Stages 5a-c (53 tests)
node scripts/check-sync.mjs          # Sync check

# Diagnostics
cd C:\AI\BasilBoardGamesWebsite
npx vitest run 2>&1 | node scripts/diagnostics/analyze-failure.mjs
npx vitest run 2>&1 | node scripts/diagnostics/ci-failure-report.mjs
```

---

## Adding a New Gate

1. Add the test/check to the appropriate stage in `full-quality-gate.yml`
2. Add a failure artifact upload step
3. Add the check name to branch protection required checks
4. Document the gate in this file
5. Add the failure pattern to `diagnostics/rules/*.json` if applicable
