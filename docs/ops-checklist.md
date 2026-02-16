# Operations Checklist

## Pre-Launch

- [ ] GitHub secrets configured (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
- [ ] Supabase migrations applied (`supabase db push`)
- [ ] Edge functions deployed (`supabase functions deploy`)
- [ ] RLS policies verified (anon can read games/published posts, admin can write)
- [ ] Seed data present (games table populated, initial posts created)
- [ ] GitHub Pages source set to "GitHub Actions"
- [ ] CI workflow passing on master

## Monitoring

- **GitHub Actions tab** — check deploy status and smoke test results
- **Supabase Dashboard > Database** — monitor table sizes, active connections
- **Supabase Dashboard > Edge Functions** — invocation logs, error rates
- **Admin Panel > Metrics tab** — DAU, WAU, retention, session data

## Incident Response

1. **Site down**: Check Actions tab for failed deploys; revert last commit if needed
2. **API errors**: Check Supabase dashboard for RLS or function errors
3. **Stale metrics**: Use Refresh button in Metrics tab; check `get_metrics_snapshot()` function
4. **Auth issues**: Verify Supabase Auth settings; check JWT expiry

## KPI Dashboard Reference

| Metric | Source | Description |
|--------|--------|-------------|
| DAU | `events` table | Unique users per day (last 30d) |
| WAU | `events` table | Unique users per week (last 12w) |
| D1 Retention | `events` table | % of users returning day after first visit |
| D7 Retention | `events` table | % of users returning 7 days after first visit |
| Avg Session | `game_end` events | Average game session duration |
| Top Games | `game_end` events | Most played games by session count (30d) |
