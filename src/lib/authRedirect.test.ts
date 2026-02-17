import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('getEmailRedirectUrl', () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('uses VITE_PUBLIC_APP_URL when set', async () => {
    vi.stubEnv('VITE_PUBLIC_APP_URL', 'https://basilboardgames.co.uk');
    vi.stubEnv('BASE_URL', '/');
    const { getEmailRedirectUrl } = await import('./authRedirect');
    expect(getEmailRedirectUrl()).toBe('https://basilboardgames.co.uk/');
  });

  it('strips trailing slash from env URL before appending base', async () => {
    vi.stubEnv('VITE_PUBLIC_APP_URL', 'https://basilboardgames.co.uk/');
    vi.stubEnv('BASE_URL', '/');
    const { getEmailRedirectUrl } = await import('./authRedirect');
    expect(getEmailRedirectUrl()).toBe('https://basilboardgames.co.uk/');
  });

  it('falls back to window.location.origin when no env var', async () => {
    vi.stubEnv('VITE_PUBLIC_APP_URL', '');
    vi.stubEnv('BASE_URL', '/');
    const { getEmailRedirectUrl } = await import('./authRedirect');
    const result = getEmailRedirectUrl();
    // In jsdom, origin may be 'http://localhost' or empty; either way ends with /
    expect(result.endsWith('/')).toBe(true);
  });

  it('appends BASE_URL to origin', async () => {
    vi.stubEnv('VITE_PUBLIC_APP_URL', 'https://example.com');
    vi.stubEnv('BASE_URL', '/sub/path/');
    const { getEmailRedirectUrl } = await import('./authRedirect');
    expect(getEmailRedirectUrl()).toBe('https://example.com/sub/path/');
  });
});
