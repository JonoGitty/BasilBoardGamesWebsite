/**
 * Resolve the Elam (Triarch) launch URL.
 *
 * Priority:
 * 1. VITE_ELAM_URL env var — explicit override for any environment
 * 2. Dev fallback — local Python server (localhost:8080)
 * 3. Production fallback — Cloudflare tunnel to online server
 */
export function getElamUrl(): string {
  const explicit = import.meta.env.VITE_ELAM_URL;
  if (explicit) return explicit;

  const isDev = import.meta.env.DEV;
  return isDev
    ? 'http://localhost:8080/index.html'
    : 'https://play.basilboardgames.co.uk/online.html';
}
