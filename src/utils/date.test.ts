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

  it('formats full ISO timestamps', () => {
    const result = formatShortDate('2026-02-19T16:14:57.000Z');
    expect(result).toBe('Feb 19');
  });

  it('returns raw input when the date is invalid', () => {
    const result = formatShortDate('not-a-date');
    expect(result).toBe('not-a-date');
  });
});
