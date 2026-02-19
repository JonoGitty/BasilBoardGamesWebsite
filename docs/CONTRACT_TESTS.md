# Contract Tests

Contract tests validate the **request/response shapes and domain constraints** that client code depends on, without hitting real edge functions or databases.

## What they cover

| File | Scope |
|---|---|
| `tests/contracts/admin-command.contract.test.ts` | Command request/response shapes, per-command arg contracts, domain value enums, error code contracts |
| `tests/contracts/feedback-ingest.contract.test.ts` | Feedback payload shape, field defaults, success/duplicate/rate-limit response shapes |
| `tests/contracts/schema.contract.test.ts` | TypeScript row types match expected database columns (guards against silent TS/SQL drift) |

## Why contract tests?

- They run fast (no network, no Supabase, no Deno).
- They catch shape drift early: if a migration adds a column or a type changes, the fixture factories and these tests surface the mismatch before it reaches production.
- They document the API surface in executable form.

## How to run

```bash
# Run only contract tests
npx vitest run tests/contracts/

# Run in watch mode
npx vitest tests/contracts/
```
