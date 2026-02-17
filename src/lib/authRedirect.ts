/**
 * Resolve the email confirmation redirect URL.
 *
 * Priority:
 * 1. VITE_PUBLIC_APP_URL env var (set in .env or CI secrets)
 * 2. window.location.origin (works for both dev and production)
 *
 * The BASE_URL suffix ensures the redirect lands on the correct path
 * when the app is served from a subdirectory (e.g. GitHub Pages).
 */
export function getEmailRedirectUrl(): string {
  const origin =
    import.meta.env.VITE_PUBLIC_APP_URL?.replace(/\/+$/, '') ??
    (typeof window !== 'undefined' ? window.location.origin : '');

  const base = import.meta.env.BASE_URL ?? '/';

  return `${origin}${base}`;
}
