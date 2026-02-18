/**
 * Resolve the Elam (Triarch) local-play URL.
 *
 * Points to the static build imported into public/games/elam/.
 * In dev, falls back to the local Triarch dev server.
 */
export function getElamUrl(): string {
  const explicit = import.meta.env.VITE_ELAM_URL;
  if (explicit) return explicit;

  const isDev = import.meta.env.DEV;
  return isDev
    ? 'http://localhost:8080/index.html'
    : import.meta.env.BASE_URL + 'games/elam/index.html';
}

/**
 * Resolve the Elam online multiplayer URL.
 *
 * Points to the live game server (Cloudflare Tunnel / Railway).
 * In dev, falls back to the local server on port 8787.
 */
export function getElamOnlineUrl(): string {
  const explicit = import.meta.env.VITE_ELAM_ONLINE_URL;
  if (explicit) return explicit;

  const isDev = import.meta.env.DEV;
  return isDev
    ? 'http://localhost:8787/online.html'
    : 'https://play.basilboardgames.co.uk/online.html';
}
