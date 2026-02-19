# E2E Test Runbook

End-to-end tests for Basil Board Games using [Playwright](https://playwright.dev/).

## Prerequisites

Install Playwright as a dev dependency and download browsers:

```bash
npm install -D @playwright/test
npx playwright install --with-deps chromium
```

## Configuration

The Playwright config is at `playwright.config.ts` in the repo root. Tests live
under `tests/e2e/`.

### Environment variables

| Variable | Required | Description |
|---|---|---|
| `TEST_USER_EMAIL` | For auth tests | Email of a non-admin test account |
| `TEST_USER_PASSWORD` | For auth tests | Password for the test account |
| `TEST_ADMIN_EMAIL` | For admin tests | Email of an admin test account |
| `TEST_ADMIN_PASSWORD` | For admin tests | Password for the admin account |
| `BASE_URL` | No | Override the default `http://localhost:5173` |
| `CI` | No | Set to any truthy value in CI pipelines |

Tests that need credentials use `test.skip()` when the matching env var is
absent, so the suite always runs cleanly even without secrets configured.

Create a `.env.test` file (git-ignored) for local use:

```
TEST_USER_EMAIL=you@example.com
TEST_USER_PASSWORD=yourpassword
TEST_ADMIN_EMAIL=admin@example.com
TEST_ADMIN_PASSWORD=adminpassword
```

## Running locally

### Headless (default)

```bash
npx playwright test
```

### Headed (watch the browser)

```bash
npx playwright test --headed
```

### With Playwright UI

```bash
npx playwright test --ui
```

### Run a single spec file

```bash
npx playwright test tests/e2e/game-launch.spec.ts
```

### Run with environment variables

```bash
# Linux / macOS
TEST_USER_EMAIL=you@example.com TEST_USER_PASSWORD=pw npx playwright test

# Windows PowerShell
$env:TEST_USER_EMAIL="you@example.com"; $env:TEST_USER_PASSWORD="pw"; npx playwright test
```

In local mode the config automatically starts the dev server via `npm run dev`
and waits for `http://localhost:5173` to be ready. If the dev server is already
running it will be reused.

## CI mode

Set the `CI` environment variable. In CI mode:

- The dev server is **not** started (set `BASE_URL` to point at a deployed
  preview or a pre-started server).
- `forbidOnly` is enabled (prevents `.only` from sneaking into CI).
- Failed tests are retried twice.
- Workers are limited to 1 for deterministic ordering.

Example GitHub Actions snippet:

```yaml
- name: Run E2E tests
  env:
    CI: true
    BASE_URL: ${{ steps.deploy.outputs.url }}
    TEST_USER_EMAIL: ${{ secrets.TEST_USER_EMAIL }}
    TEST_USER_PASSWORD: ${{ secrets.TEST_USER_PASSWORD }}
    TEST_ADMIN_EMAIL: ${{ secrets.TEST_ADMIN_EMAIL }}
    TEST_ADMIN_PASSWORD: ${{ secrets.TEST_ADMIN_PASSWORD }}
  run: npx playwright test
```

## Viewing reports

After a test run, open the HTML report:

```bash
npx playwright show-report
```

Screenshots, videos, and traces for failed tests are stored in `test-results/`.

## Test inventory

| Spec file | Tests | Requires credentials |
|---|---|---|
| `auth.spec.ts` | 5 | Partial (3 skipped without `TEST_USER_*`) |
| `admin-posts.spec.ts` | 4 | Yes (`TEST_ADMIN_*`) |
| `admin-feedback.spec.ts` | 4 | Yes (`TEST_ADMIN_*`) |
| `whats-new.spec.ts` | 2 | No |
| `game-launch.spec.ts` | 3 | No |
