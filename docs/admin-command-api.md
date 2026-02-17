# Admin Command API

The admin control plane is exposed through a deterministic command endpoint:

- Endpoint: `POST /functions/v1/admin-command`
- Auth: Supabase user JWT in `Authorization: Bearer <token>`
- Access: only users with `profiles.role = 'admin'`

This API is intended for:

- the web admin UI
- future automation scripts
- future agent-driven operations

## Request Shape

```json
{
  "name": "games.patch",
  "args": {
    "gameId": "almost",
    "changes": {
      "vault": false
    }
  }
}
```

## Response Shape

```json
{
  "ok": true,
  "command": "games.patch",
  "actorUserId": "00000000-0000-0000-0000-000000000000",
  "result": {
    "game": {
      "id": "almost"
    }
  }
}
```

Error response:

```json
{
  "ok": false,
  "code": "forbidden",
  "error": "Admin role required"
}
```

## Supported Commands

## `games.patch`

Set explicit game fields.

`args`:

- `gameId: string`
- `changes: { title?, description?, emoji?, url?, pinned?, vault? }`

## `games.set_active_lineup`

Set the active lineup deterministically by ID. Any game not included is vaulted.

`args`:

- `activeGameIds: string[]`

## `posts.upsert_draft`

Create or replace a draft deterministically by post ID.

`args`:

- `id: string`
- `title: string`
- `description: string`
- `emoji: string`
- `category: "patch" | "experiment" | "announcement"`

## `posts.patch`

Patch post metadata.

`args`:

- `postId: string`
- `changes: { title?, description?, emoji?, category? }`

## `posts.set_published`

Set publish state explicitly.

`args`:

- `postId: string`
- `published: boolean`

## `posts.delete`

Delete a post by ID.

`args`:

- `postId: string`

## `site.set_launcher_style`

Set the game launcher theme for the admin's profile.

`args`:

- `style: "classic" | "craft-desk" | "netflix"`

## Audit Log

Every command invocation is logged to `admin_command_log` (migration `010_admin_command_audit.sql`).

| Column | Type | Description |
|--------|------|-------------|
| `id` | bigint | Auto-incrementing primary key |
| `command` | text | Command name (e.g. `games.set_active_lineup`) |
| `actor_id` | uuid | UUID of the admin who ran the command |
| `args` | jsonb | Full args payload |
| `success` | boolean | Whether the command succeeded |
| `error_code` | text | Error code if failed (null on success) |
| `error_msg` | text | Error message if failed (null on success) |
| `created_at` | timestamptz | Timestamp |

Logging is best-effort: if the audit insert fails, the command still returns its result (a warning is logged to console).

**Query recent commands:**

```sql
SELECT command, actor_id, success, error_code, created_at
FROM admin_command_log
ORDER BY created_at DESC
LIMIT 20;
```

**RLS:** Admins can read the log. Only `service_role` (edge function) can write.

## Security Model

- The function verifies the JWT via Supabase Auth (`auth.getUser`).
- The function checks admin role in `public.profiles`.
- Non-admin or unsigned requests are rejected with `401`/`403`.
- All writes go through the edge function using `SUPABASE_SERVICE_ROLE_KEY` (bypasses RLS).
- Direct client writes to `games` and `posts` tables are blocked (RLS admin-write policies removed in migration `009`).

## Operational Notes

- Deploy this function alongside other edge functions:

```bash
supabase functions deploy admin-command --no-verify-jwt
```

- Keep command names stable; treat them as an external contract.
- See `docs/admin-ops.md` for CLI usage, admin promotion, and audit log queries.
