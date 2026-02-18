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

  it('falls back to local static bundle when no env var set', async () => {
    vi.stubEnv('VITE_ELAM_URL', '');
    const { getElamUrl } = await import('./elamUrl');
    const url = getElamUrl();
    expect(url).toContain('games/elam/index.html');
  });
});
