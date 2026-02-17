export type ConsentLevel = 'all' | 'essential';

const CONSENT_KEY = 'basil_consent';

/** Read current consent. Returns null if no consent has been recorded. */
export function getConsent(): ConsentLevel | null {
  try {
    const val = localStorage.getItem(CONSENT_KEY);
    if (val === 'all' || val === 'essential') return val;
    return null;
  } catch {
    return null;
  }
}

/** Persist consent choice. */
export function setConsent(level: ConsentLevel): void {
  try {
    localStorage.setItem(CONSENT_KEY, level);
  } catch {
    /* storage full — non-critical */
  }
}

/** Check if analytics are consented to (level must be 'all'). */
export function hasAnalyticsConsent(): boolean {
  return getConsent() === 'all';
}
