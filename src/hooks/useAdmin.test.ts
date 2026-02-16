import { describe, it, expect } from 'vitest';
import { DEFAULT_PROFILE } from '../types/profile';
import type { Profile } from '../types/profile';

describe('admin role check', () => {
  it('default profile has user role', () => {
    expect(DEFAULT_PROFILE.role).toBe('user');
  });

  it('admin profile is identified', () => {
    const adminProfile: Profile = { ...DEFAULT_PROFILE, role: 'admin' };
    expect(adminProfile.role).toBe('admin');
  });

  it('user profile is not admin', () => {
    const userProfile: Profile = { ...DEFAULT_PROFILE, role: 'user' };
    expect(userProfile.role).not.toBe('admin');
  });
});
