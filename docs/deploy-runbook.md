# Deploy Runbook

## Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL (public, baked into client bundle) |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key (public, baked into client bundle) |

These are set in **Settings > Secrets and variables > Actions**.

## Deploy Flow

1. Push to `master` triggers CI (typecheck, lint, test, build)
2. If CI passes, the `build-deploy` job builds with Supabase env vars and deploys to GitHub Pages
3. A `smoke-test` job verifies the site returns HTTP 200

## Manual Deploy

Trigger via GitHub Actions UI: **Actions > Deploy to GitHub Pages > Run workflow**.

## Rollback

1. Revert the commit: `git revert HEAD && git push`
2. Or re-run a previous successful deploy from the Actions tab

## Supabase Migrations

```bash
# Apply pending migrations
supabase db push

# Deploy updated edge functions
supabase functions deploy events-ingest --no-verify-jwt
supabase functions deploy rotation-run --no-verify-jwt
```

## GitHub Pages Setup

1. Go to **Settings > Pages**
2. Source: **GitHub Actions**
3. The deploy workflow handles the rest

## Environment Notes

- The `base` path in `vite.config.ts` is set to `/BasilBoardGamesWebsite/` for GitHub Pages
- Supabase env vars are injected at build time via `VITE_` prefix
- The app gracefully degrades when Supabase is unreachable (fallback data)
