import { describe, it, expect } from 'vitest';
import {
  normalizeNickname,
  canonicalizeNickname,
  containsCrown,
  validateNickname,
} from './nickname';

describe('normalizeNickname', () => {
  it('trims leading and trailing whitespace', () => {
    expect(normalizeNickname('  hello  ')).toBe('hello');
  });

  it('collapses multiple internal spaces', () => {
    expect(normalizeNickname('hello   world')).toBe('hello world');
  });

  it('handles both trim and collapse', () => {
    expect(normalizeNickname('  hello   world  ')).toBe('hello world');
  });

  it('returns empty string for whitespace-only input', () => {
    expect(normalizeNickname('   ')).toBe('');
  });
});

describe('canonicalizeNickname', () => {
  it('lowercases after normalizing', () => {
    expect(canonicalizeNickname('Hello World')).toBe('hello world');
  });

  it('treats Richard and richard as the same', () => {
    expect(canonicalizeNickname('Richard')).toBe(canonicalizeNickname(' richard '));
  });

  it('treats Player 1 and player 1 as the same', () => {
    expect(canonicalizeNickname('Player 1')).toBe(canonicalizeNickname('player 1'));
  });
});

describe('containsCrown', () => {
  it('detects crown emoji', () => {
    expect(containsCrown('King\u{1F451}')).toBe(true);
  });

  it('returns false for strings without crown', () => {
    expect(containsCrown('Player')).toBe(false);
  });

  it('returns false for empty string', () => {
    expect(containsCrown('')).toBe(false);
  });
});

describe('validateNickname', () => {
  it('returns null for a valid nickname', () => {
    expect(validateNickname('Player', false)).toBeNull();
  });

  it('rejects crown emoji for non-admin', () => {
    expect(validateNickname('King\u{1F451}', false)).toBe(
      'Only admins can use 👑 in nicknames',
    );
  });

  it('allows crown emoji for admin', () => {
    expect(validateNickname('King\u{1F451}', true)).toBeNull();
  });

  it('rejects nicknames over 20 characters', () => {
    expect(validateNickname('a'.repeat(21), false)).toBe(
      'Nickname must be 20 characters or fewer',
    );
  });

  it('accepts exactly 20 characters', () => {
    expect(validateNickname('a'.repeat(20), false)).toBeNull();
  });
});
