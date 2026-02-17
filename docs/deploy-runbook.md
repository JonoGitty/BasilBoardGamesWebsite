# Deploy Runbook

## Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL (public, baked into client bundle) |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key (public, baked into client bundle) |
| `VITE_PUBLIC_APP_URL` | Production app URL for auth email redirects (e.g. `https://basilboardgames.co.uk`) |

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
# Apply pending migrations (includes 008-010: account deletion, admin-only commands, audit log)
supabase db push

# Deploy updated edge functions
supabase functions deploy events-ingest --no-verify-jwt
supabase functions deploy rotation-run --no-verify-jwt
supabase functions deploy admin-command --no-verify-jwt
```

### Migration Inventory

| File | Purpose |
|------|---------|
| `008_account_deletion.sql` | Adds `deletion_requested_at` to profiles, `request_account_deletion()` RPC |
| `009_admin_commands_only.sql` | Drops direct admin-write RLS policies on games/posts tables |
| `010_admin_command_audit.sql` | Creates `admin_command_log` table with indexes and RLS |

## GitHub Pages Setup

1. Go to **Settings > Pages**
2. Source: **GitHub Actions**
3. The deploy workflow handles the rest

## Supabase Auth URL Configuration

In the Supabase dashboard under **Authentication > URL Configuration**:

| Setting | Value |
|---------|-------|
| **Site URL** | `https://basilboardgames.co.uk/` |
| **Redirect URLs** | `https://basilboardgames.co.uk/` |
| | `http://localhost:5173/` |
| | `http://localhost:4173/` |

The Site URL is the default redirect for confirmation emails. The additional
redirect URLs are the allowed targets for `emailRedirectTo` in the signup call.

## Elam (Triarch) External Service

Elam is NOT a static bundle — it requires its own Node.js server.
The hub opens it in a new tab via `play.basilboardgames.co.uk`.

**Pre-requisites for Elam to work in production:**
1. Triarch Node.js server running (`npm start` in Triarch repo)
2. Cloudflare tunnel active mapping `play.basilboardgames.co.uk` → `localhost:8787`
3. Health check passes: `curl https://play.basilboardgames.co.uk/api/online/health`

**To check service status:**
```bash
npm run elam:check
```

**Optional override:** Set `VITE_ELAM_URL` GitHub secret to point to a different URL.

See `docs/elam-service-runbook.md` and `docs/elam-integration-audit.md` for details.

## Admin Command Backend

Admin writes are executed via deterministic backend commands in the
`admin-command` edge function.

- Commands are admin-only and require a signed-in user with `profiles.role = 'admin'`
- The frontend admin UI sends command payloads instead of direct table writes
- Every command is audit-logged to `admin_command_log` (success and failure)
- This creates a stable integration surface for future automation/agent workflows

See `docs/admin-command-api.md` for the command contract and `docs/admin-ops.md` for CLI usage.

## Environment Notes

- The `base` path in `vite.config.ts` is set to `/` for the custom domain
- Supabase env vars are injected at build time via `VITE_` prefix
- `VITE_PUBLIC_APP_URL` controls email confirmation redirect links
- The app gracefully degrades when Supabase is unreachable (fallback data)
