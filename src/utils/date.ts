/**
 * Format an ISO date string as a short human-readable label.
 * e.g. "2026-02-14" → "Feb 14"
 */
export function formatShortDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
