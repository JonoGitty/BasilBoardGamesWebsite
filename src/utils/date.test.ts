import { describe, it, expect } from 'vitest';
import { formatShortDate } from './date';

describe('formatShortDate', () => {
  it('formats a date as "Mon DD"', () => {
    const result = formatShortDate('2026-02-14');
    expect(result).toBe('Feb 14');
  });

  it('formats January correctly', () => {
    const result = formatShortDate('2026-01-01');
    expect(result).toBe('Jan 1');
  });

  it('formats December correctly', () => {
    const result = formatShortDate('2025-12-25');
    expect(result).toBe('Dec 25');
  });
});
