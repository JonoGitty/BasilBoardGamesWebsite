# Admin Operations Guide

## Promoting a User to Admin

Admin role can only be assigned via direct SQL (never via client-side code).

**Option 1: Supabase Dashboard (recommended)**

1. Go to Supabase Dashboard > Table Editor > `profiles`
2. Find the user row by their UUID
3. Set `role` to `admin`
4. Save

**Option 2: SQL Console**

```sql
-- Replace <USER_UUID> with the actual user ID from auth.users
UPDATE public.profiles
SET role = 'admin'
WHERE id = '<USER_UUID>';
```

**Option 3: CLI script**

```bash
# Using supabase CLI with service role
supabase db execute --sql "UPDATE public.profiles SET role = 'admin' WHERE id = '<USER_UUID>';"
```

**Important:** Never commit user UUIDs into migration files. Admin promotion is a per-environment operational task, not a schema change.

## Admin Command CLI

A local helper script exists for sending admin commands from the terminal.

### Setup

```bash
export SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_ACCESS_TOKEN="<admin-user-jwt>"
```

To get your access token:
1. Sign in to the app as an admin user
2. Open browser DevTools > Application > Local Storage
3. Find the Supabase auth key, copy the `access_token` value

### Usage

```bash
node scripts/admin-command-cli.mjs <command-name> '<args-json>'
```

### Examples

```bash
# Set the active game lineup
node scripts/admin-command-cli.mjs games.set_active_lineup \
  '{"activeGameIds":["elam","interrogate","almost","sidequests"]}'

# Pin a game
node scripts/admin-command-cli.mjs games.patch \
  '{"gameId":"elam","changes":{"pinned":true}}'

# Create a draft post
node scripts/admin-command-cli.mjs posts.upsert_draft \
  '{"id":"feb-update","title":"February Update","description":"New games added.","emoji":"🎲","category":"announcement"}'

# Publish a post
node scripts/admin-command-cli.mjs posts.set_published \
  '{"postId":"feb-update","published":true}'

# Delete a post
node scripts/admin-command-cli.mjs posts.delete \
  '{"postId":"old-post"}'

# Set launcher style
node scripts/admin-command-cli.mjs site.set_launcher_style \
  '{"style":"craft-desk"}'
```

## Command Audit Log

Every admin command is logged to `admin_command_log` with:

| Column | Description |
|--------|-------------|
| `command` | Command name (e.g. `games.set_active_lineup`) |
| `actor_id` | UUID of the admin who ran the command |
| `args` | Full args payload (JSONB) |
| `success` | Whether the command succeeded |
| `error_code` | Error code if failed |
| `error_msg` | Error message if failed |
| `created_at` | Timestamp |

Query recent commands:

```sql
SELECT command, actor_id, success, error_code, created_at
FROM admin_command_log
ORDER BY created_at DESC
LIMIT 20;
```

## Architecture Notes

- All admin writes flow through the `admin-command` edge function
- Direct client writes to `games` and `posts` tables are blocked (RLS policies dropped)
- The edge function uses `SUPABASE_SERVICE_ROLE_KEY` to bypass RLS after verifying admin role
- Read operations (fetch games, fetch posts, metrics RPC) still use standard Supabase client with user JWT
