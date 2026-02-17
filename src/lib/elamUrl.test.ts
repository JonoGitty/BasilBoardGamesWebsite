import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('getElamUrl', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('uses VITE_ELAM_URL when set', async () => {
    vi.stubEnv('VITE_ELAM_URL', 'https://custom.example.com/elam');
    const { getElamUrl } = await import('./elamUrl');
    expect(getElamUrl()).toBe('https://custom.example.com/elam');
  });

  it('falls back to a valid URL when no env var set', async () => {
    vi.stubEnv('VITE_ELAM_URL', '');
    const { getElamUrl } = await import('./elamUrl');
    const url = getElamUrl();
    // In vitest, DEV is true so we get localhost; in production we'd get play.*
    expect(url).toMatch(/^https?:\/\//);
    expect(url).toMatch(/\.(html|co\.uk)/);
  });
});
