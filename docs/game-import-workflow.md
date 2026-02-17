# Game Import Workflow

Games are developed in separate private repos and imported into the hub as static bundles.

## Quick Start

```bash
# Import any game
npm run game:import -- --id <game-id> --source "<path-to-game-repo>"

# Import Interrogate (shorthand)
npm run game:import:interrogate
```

## How It Works

1. **Build the game** in its own repo (`npm run build`)
2. **Run the import script** — it copies the built output into `public/games/<id>/`
3. **Asset paths are auto-rewritten** to relative (`./assets/...`) so they work when served as a subfolder
4. **Commit and push** — the deploy workflow picks up the new files automatically

## Adding a New Game

### 1. Develop the game in a separate repo

Any static SPA works (React, vanilla JS, etc.). The only requirement is that `npm run build` produces a `dist/` folder with an `index.html`.

### 2. Import it

```bash
npm run game:import -- --id my-game --source "C:\AI\MyGame"
```

### 3. Register it in the manifest

Add an entry to `src/data/games.ts`:

```typescript
{
  id: 'my-game',
  title: 'My Game',
  description: 'A description of the game.',
  emoji: '\u{1F3AE}',
  status: 'active',
  url: import.meta.env.BASE_URL + 'games/my-game/index.html',
},
```

### 4. Add to the featured allowlist (if applicable)

Update `ALLOWED_IDS` in `src/hooks/useFeaturedGames.ts` to include the new game ID.

### 5. Add to Supabase

Insert a row in the `games` table with `vault = false`.

### 6. Add an npm shorthand (optional)

In `package.json`:
```json
"game:import:my-game": "node scripts/import-static-game.mjs --id my-game --source \"C:\\AI\\MyGame\""
```

## Script Details

**Location:** `scripts/import-static-game.mjs`

**Arguments:**
| Flag | Required | Description |
|------|----------|-------------|
| `--id` | Yes | Game identifier (matches `games.id` in DB and manifest) |
| `--source` | Yes | Path to the game repo or build folder |

**Behavior:**
- Looks for `dist/index.html` first, falls back to `index.html` in root
- Deletes existing `public/games/<id>/` before copying
- Rewrites `src=` and `href=` paths pointing to `assets/` to use `./assets/`
- Warns if absolute OS paths remain after rewrite

## Current Games

| ID | Source Repo | Import Command |
|----|-------------|----------------|
| `interrogate` | `C:\AI\Interrogate!` | `npm run game:import:interrogate` |
