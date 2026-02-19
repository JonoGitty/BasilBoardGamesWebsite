/**
 * Format an ISO date string as a short human-readable label.
 * Supports both date-only (`YYYY-MM-DD`) and full ISO timestamps.
 */
export function formatShortDate(iso: string): string {
  const source = iso.includes('T') ? iso : `${iso}T00:00:00`;
  const d = new Date(source);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
