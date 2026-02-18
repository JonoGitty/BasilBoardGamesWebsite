# Feedback System Runbook

## Architecture Overview

Anonymous feedback flows through a centralized pipeline:

```
Game Page / Hub Page
        │
        ▼
localStorage queue (basil_feedback_queue, elam_feedback_queue_local_v1, etc.)
        │
        ▼ POST
feedback-ingest (Supabase Edge Function)
        │
        ├─ Validate & sanitize payload
        ├─ Hash IP (SHA-256 with salt)
        ├─ Rate limit check (per-minute / per-day)
        └─ Insert into `feedback` table
                │
                ▼
Admin Panel → Feedback tab (read via RLS, status updates via admin-command)
```

### Key Components

| Component | Location | Purpose |
|-----------|----------|---------|
| Migration | `supabase/migrations/014_feedback.sql` | Table, indexes, RLS policies |
| Edge function | `supabase/functions/feedback-ingest/index.ts` | Validate, sanitize, rate limit, insert |
| Static client | `public/feedback-client.js` | Queue + retry for static game pages |
| React service | `src/services/feedbackService.ts` | Typed wrapper for hub/React pages |
| Admin command | `supabase/functions/admin-command/index.ts` | `feedback.update_status` handler |
| Admin API | `src/services/adminApi.ts` | `fetchFeedback()`, `updateFeedbackStatus()` |
| Admin tab | `src/components/AdminFeedbackTab.tsx` | List, filter, expand, status change |

## Deployment

**Deploy order is critical.** Follow these steps in sequence:

### 1. Run Migration

Execute `014_feedback.sql` via the Supabase dashboard SQL editor or CLI:

```bash
supabase db push
```

### 2. Reload Supabase Schema Cache

After applying the migration, PostgREST (Supabase's REST layer) must refresh its
schema cache before the `feedback` table is accessible via the client SDK.

- **Dashboard:** Project Settings > API > click **Reload Schema Cache**
- **CLI:** `supabase db reset` (local dev) or wait ~60s for automatic refresh

> **Common issue:** If the admin panel shows *"Could not find the table 'public.feedback'
> in the schema cache"*, this means the schema cache has not been reloaded after migration.
> Reload it as described above, then refresh the admin page.

### 3. Deploy Edge Function

```bash
supabase functions deploy feedback-ingest --no-verify-jwt
```

> The `--no-verify-jwt` flag is required because feedback is submitted anonymously
> without authentication tokens.

### 4. Set Secrets

```bash
supabase secrets set FEEDBACK_SALT="your-random-salt-here"
```

Optional CORS origin allowlist (default: allow all):

```bash
supabase secrets set FEEDBACK_ALLOWED_ORIGINS="https://basilboardgames.co.uk,https://play.basilboardgames.co.uk"
```

Optional rate limit tuning (defaults shown):

```bash
supabase secrets set FEEDBACK_RATE_PER_MINUTE=30
supabase secrets set FEEDBACK_RATE_PER_DAY=2000
```

### 5. Verify

```bash
# Replace YOUR_PROJECT_REF with your Supabase project reference
curl -X POST https://YOUR_PROJECT_REF.supabase.co/functions/v1/feedback-ingest \
  -H "Content-Type: application/json" \
  -d '{"clientFeedbackId":"test_1","feedback":"hello","page":"test","source":"curl"}'
```

Expected: `201` with `{"ok":true,"receiptId":"...","acceptedAt":"...","clientFeedbackId":"test_1"}`

Same request again: `200` with `{"ok":true,"duplicate":true,...}`

## Rate Limiting

Rate limits are per IP hash:

| Window | Default | Env Var |
|--------|---------|---------|
| 1 minute | 30 | `FEEDBACK_RATE_PER_MINUTE` |
| 1 day | 2000 | `FEEDBACK_RATE_PER_DAY` |

When rate-limited, the response includes `retryAfterSec` and clients back off automatically.

## Adding Feedback to a New Game

### Option A: Static Page (uses `site-config.js` + `feedback-client.js`)

Add both scripts to your HTML (order matters — config must load first):

```html
<script src="/site-config.js"></script>
<script src="/feedback-client.js"></script>
```

`site-config.js` sets `window.BASIL_FEEDBACK_INGEST_URL` which `feedback-client.js`
reads automatically. No hardcoded URLs in game code.

```html
<script>
  document.getElementById("feedbackBtn").addEventListener("click", async () => {
    const text = prompt("Anonymous feedback (max 500 chars):");
    if (!text) return;
    const result = await BasilFeedback.submit({
      gameId: "your-game-id",
      page: "local",
      feedback: text,
      context: { /* game state snapshot */ }
    });
    if (result.receipt) {
      alert("Thanks! Receipt: " + result.receipt.receiptId);
    }
  });
</script>
```

> **Updating the ingest URL:** edit `public/site-config.js` — this is the single
> deployment config point for all static game pages.

### Option B: React Page (uses `feedbackService.ts`)

```typescript
import { submitFeedback } from '../services/feedbackService';

const result = await submitFeedback({
  gameId: 'your-game-id',
  page: 'hub',
  feedback: userInput,
  context: { /* optional */ },
});
```

## Admin Panel Usage

1. Navigate to Admin > Feedback tab
2. Filter by status (New / Reviewed / Resolved / Dismissed)
3. Click a row to expand and see full feedback text + context
4. Add an admin note and change status as needed

Status workflow: `new` → `reviewed` → `resolved` or `dismissed`

## Troubleshooting

### "Could not find the table 'public.feedback' in the schema cache"

This is the most common issue after initial setup:

1. Verify the `014_feedback.sql` migration has been applied (check Supabase dashboard > Table Editor)
2. Reload the PostgREST schema cache: Project Settings > API > **Reload Schema Cache**
3. Wait 5-10 seconds, then refresh the admin panel
4. If the issue persists, check that RLS is enabled and admin SELECT policy exists

### Feedback not appearing in admin panel

1. Check browser console for network errors
2. Verify the edge function is deployed: `supabase functions list`
3. Check Supabase function logs: `supabase functions logs feedback-ingest`
4. Verify RLS policies allow admin SELECT

### Rate limit too aggressive

Increase via secrets:

```bash
supabase secrets set FEEDBACK_RATE_PER_MINUTE=60
supabase functions deploy feedback-ingest
```

### Queue growing in localStorage

If `basil_feedback_queue` accumulates items, check:
- Is the edge function URL correct?
- Is the function deployed and responding?
- Check `supabase functions logs feedback-ingest` for errors

### Duplicate feedback

The `client_feedback_id` unique index prevents duplicates. If a user submits the same feedback twice (e.g., from a queue retry), the edge function returns `duplicate: true` without creating a new row.

## Data Retention

Feedback is retained for 12 months per the privacy policy. To clean up old feedback:

```sql
DELETE FROM feedback WHERE created_at < now() - interval '12 months';
```

## Related Migrations

### Privacy Policy Consent (profiles table)

Add privacy policy acceptance tracking to the `profiles` table. Apply via Supabase
SQL editor, then reload schema cache:

```sql
-- Add privacy policy acceptance fields to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS privacy_policy_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS privacy_policy_version text;

COMMENT ON COLUMN public.profiles.privacy_policy_accepted_at IS 'Timestamp when user accepted the privacy policy during signup';
COMMENT ON COLUMN public.profiles.privacy_policy_version IS 'Version string of the privacy policy accepted (e.g. 2026-02-18)';
```

These columns are nullable so existing users are unaffected. New signups will have
both fields populated automatically.
