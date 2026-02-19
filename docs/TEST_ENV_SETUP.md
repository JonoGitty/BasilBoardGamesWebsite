# Test Environment Setup

> Last updated: 2026-02-18

## Quick Start

```bash
# Run unit tests (no external deps needed)
npm test

# Run with environment validation
node scripts/test/setup-env.mjs && npm test
```

## Environment Variables

| Variable | Required For | Default (Test Mode) |
|----------|-------------|-------------------|
| `VITE_SUPABASE_URL` | Unit tests | `http://localhost:54321` |
| `VITE_SUPABASE_ANON_KEY` | Unit tests | `test-anon-key-placeholder` |
| `SUPABASE_SERVICE_ROLE_KEY` | Live contract tests | — (optional) |
| `LIVE_CONTRACT_TESTS` | Contract tests against real Supabase | `0` |

## Scripts

| Script | Purpose |
|--------|---------|
| `scripts/test/setup-env.mjs` | Validate/set env vars for test mode |
| `scripts/test/reset-state.mjs` | Clear test state (idempotent) |
| `scripts/test/seed-fixtures.mjs` | Create stable fixture data |

## Fixture Factories (TypeScript)

Located in `src/test/fixtures/supabase-rows.ts`:

```typescript
import { makeGameRow, makePostRow, makeFeedbackRow, makeProfile, makeMetricsSnapshot } from '../test/fixtures/supabase-rows';

const game = makeGameRow({ title: 'Custom Game' });
const post = makePostRow({ published: true });
const feedback = makeFeedbackRow({ status: 'reviewed' });
const profile = makeProfile({ role: 'admin' });
const metrics = makeMetricsSnapshot();
```

## Mock Helpers

Located in `src/test/helpers/mock-supabase.ts`:

```typescript
import { mockSupabaseQuery, mockEdgeFunctionInvoke } from '../test/helpers/mock-supabase';

// Mock a Supabase table query
const mock = mockSupabaseQuery('games', [makeGameRow()]);

// Mock an edge function call
const invoke = mockEdgeFunctionInvoke('admin-command', { ok: true, result: {} });
```

## Component Test Helper

Located in `src/test/helpers/render-with-providers.tsx`:

```typescript
import { renderWithProviders } from '../test/helpers/render-with-providers';

const { getByText } = renderWithProviders(<MyComponent />);
```

## Triarch Fixtures

Engine fixtures in `test/helpers/engine-fixtures.js`:
- `makePlayers(count)` — player descriptors
- `makeStartedGame(playerCount)` — game past setup phase
- `makeGameWithFlag(carrierSeat)` — game with flag carrier
- `seededRandom(seed)` — deterministic RNG

Server fixtures in `test/helpers/server-fixtures.js`:
- `makeRoomPayload(overrides)` — room creation body
- `makeJoinPayload(overrides)` — join request body
- `makeActionPayload(type, overrides)` — game action body
