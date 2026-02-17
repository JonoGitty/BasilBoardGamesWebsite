# Elam (Triarch) Integration Audit

## Runtime Dependency Inventory

| Component | Runtime | Port | Purpose |
|-----------|---------|------|---------|
| Local server (`server.py`) | Python 3 | 8080 | Hotseat play, feedback API, dev logging |
| Online server (`online/server.js`) | Node.js + Express 5 + ws | 8787 | Multiplayer rooms, WebSocket, game validation |
| SQLite DB (`online/online.db`) | better-sqlite3 | — | Room/session persistence |

### Client-Server API Surface

**Online mode (primary for production):**
- `POST /api/online/rooms` — create room
- `POST /api/online/invite/verify` — validate invite
- `POST /api/online/join` — join via invite token
- `POST /api/online/join-by-code` — join via room code + passcode
- `POST /api/online/reconnect` — restore session
- `POST /api/online/session/refresh` — rotate token
- `POST /api/online/rooms/:code/start` — start game
- `POST /api/online/rooms/:code/action` — submit move
- `GET /api/online/rooms/:code` — room state
- `GET /api/online/health` — health check
- `WS /ws?sessionToken=<token>` — real-time room updates

**Local mode:**
- `POST /api/feedback` — anonymous feedback
- `POST /log` — dev telemetry
- All game logic runs client-side

### Key Architectural Facts
- Game engine (`online/engine.js`) is server-authoritative for online mode
- HMAC-SHA256 signed tokens for invite/session auth (no passwords, no JWT)
- Room TTL: 180 min inactive, cleanup every 60 sec
- Bot AI runs server-side with 7 difficulty profiles
- Cloudflare tunnel maps `play.basilboardgames.co.uk` → Node.js server

## Static-Import Feasibility Verdict

**NOT FEASIBLE as a static bundle.**

- Online mode requires Node.js for room management, WebSocket, game state validation, SQLite persistence
- Local mode is ~93% static but requires a server for feedback API and rate limiting
- Cannot be copied into `public/games/elam/` like Interrogate

## Architecture Options Compared

| Option | Pros | Cons | Verdict |
|--------|------|------|---------|
| **A. Static import** | Simple, same as Interrogate | Breaks multiplayer, no server | Rejected |
| **B. External service launch** | Zero backend in Basil, Triarch runs independently | Requires separate hosting | Selected |
| **C. Proxy through Basil** | Single domain | Adds server to a static site, complex | Rejected |
| **D. Iframe embed** | Inline experience | CSP issues, WebSocket proxying, auth complexity | Rejected |

## Selected Approach

**Option B: External Service Launch**

Clicking the Elam card opens the Triarch app in a new tab via `window.open()`. The URL is resolved from:
1. `VITE_ELAM_URL` env var (explicit override)
2. Dev fallback: `http://localhost:8080` (local Python server)
3. Production fallback: `https://play.basilboardgames.co.uk` (Cloudflare tunnel)

This matches the existing `gameLauncher.ts` pattern — games with a `url` field open externally.

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Triarch server is down | Health check script (`scripts/check-elam-service.mjs`); fallback message in launcher |
| Cloudflare tunnel drops | Monitor via tunnel dashboard; auto-reconnect is built in |
| Cross-origin issues | Triarch is on a separate subdomain; no shared auth needed |
| User confusion (new tab) | Consistent with how Interrogate launches; expected behavior |
| Local dev needs Triarch running | Documented in `docs/elam-service-runbook.md`; Elam card still appears, just fails to open if server is down |
