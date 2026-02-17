# Elam (Triarch) Service Runbook

Elam is a server-backed game that runs separately from the Basil hub.
The hub links to it externally; it is NOT a static bundle.

## Local Development

### Option A: Local mode (Python — hotseat/bots)

```bash
cd C:\AI\Triarch
python server.py
# Serves on http://localhost:8080
# Entry point: http://localhost:8080/index.html
```

### Option B: Online mode (Node.js — multiplayer rooms)

```bash
cd C:\AI\Triarch
npm install
npm start
# Serves on http://localhost:8787
# Entry point: http://localhost:8787/online.html
```

### Running both

Run both servers simultaneously for full local experience:
- Local mode: `python server.py` (port 8080)
- Online mode: `npm start` (port 8787)

### Basil dev config

In Basil's `.env`, optionally set:
```
VITE_ELAM_URL=http://localhost:8080/index.html
```

Or leave blank — Basil defaults to `localhost:8080` in dev mode automatically.

## Production Hosting

### Current setup

| Component | Host | URL |
|-----------|------|-----|
| Online server | Local machine + Cloudflare Tunnel | `https://play.basilboardgames.co.uk` |
| Entry point | — | `https://play.basilboardgames.co.uk/online.html` |

### Cloudflare Tunnel

The tunnel maps `play.basilboardgames.co.uk` → `localhost:8787` (Node.js).

To start:
```bash
cd C:\AI\Triarch
npm start
# Then in another terminal:
cloudflared tunnel run <tunnel-name>
```

### Health check

```bash
curl https://play.basilboardgames.co.uk/api/online/health
# Expected: { "ok": true, "rooms": N, "sessions": N, ... }
```

### Required environment variables (Triarch server)

| Variable | Default | Description |
|----------|---------|-------------|
| `ONLINE_PORT` | `8787` | Node.js server port |
| `ONLINE_BIND` | `0.0.0.0` | Bind address |
| `PORT` | `8080` | Python server port |

## Operational Checklist

### Pre-launch
- [ ] Node.js server running (`npm start` in Triarch)
- [ ] Cloudflare tunnel active (`cloudflared tunnel run`)
- [ ] Health check passes (`/api/online/health` returns `ok: true`)
- [ ] Basil hub links to correct URL (check `VITE_ELAM_URL` or default)

### Monitoring
- Check `logs/online/ONLINE_GAME_EVENTS.ndjson` for game activity
- Check `logs/online/ONLINE_TREND_SUMMARY.md` for stats
- Health endpoint returns room/session counts

### Incident response
1. **Elam link broken**: Check tunnel status, verify Node.js is running
2. **Rooms not creating**: Check SQLite DB permissions, restart server
3. **WebSocket disconnects**: Check tunnel stability, server memory
4. **Feedback not saving**: Check `logs/feedback/` directory permissions

## Domain Strategy

| Domain | Purpose |
|--------|---------|
| `basilboardgames.co.uk` | Main hub (GitHub Pages, static) |
| `play.basilboardgames.co.uk` | Elam multiplayer server (Cloudflare Tunnel → Node.js) |

This separation keeps the hub static-deployable while Elam runs its own server.
Future games that need servers can follow the same pattern with their own subdomains.
