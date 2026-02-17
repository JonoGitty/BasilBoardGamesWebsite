import { describe, it, expect, beforeEach } from 'vitest';
import { getConsent, setConsent, hasAnalyticsConsent } from './consent';

describe('consent', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns null when no consent recorded', () => {
    expect(getConsent()).toBeNull();
  });

  it('stores and retrieves "all" consent', () => {
    setConsent('all');
    expect(getConsent()).toBe('all');
  });

  it('stores and retrieves "essential" consent', () => {
    setConsent('essential');
    expect(getConsent()).toBe('essential');
  });

  it('hasAnalyticsConsent returns true for "all"', () => {
    setConsent('all');
    expect(hasAnalyticsConsent()).toBe(true);
  });

  it('hasAnalyticsConsent returns false for "essential"', () => {
    setConsent('essential');
    expect(hasAnalyticsConsent()).toBe(false);
  });

  it('hasAnalyticsConsent returns false when no consent', () => {
    expect(hasAnalyticsConsent()).toBe(false);
  });

  it('ignores invalid stored values', () => {
    localStorage.setItem('basil_consent', 'invalid');
    expect(getConsent()).toBeNull();
    expect(hasAnalyticsConsent()).toBe(false);
  });
});
