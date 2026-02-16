import { describe, it, expect } from 'vitest';
import { formatDuration, formatCompactDate } from './format';

describe('formatDuration', () => {
  it('formats seconds only', () => {
    expect(formatDuration(45_000)).toBe('45s');
  });

  it('formats minutes and seconds', () => {
    expect(formatDuration(192_000)).toBe('3m 12s');
  });

  it('formats zero', () => {
    expect(formatDuration(0)).toBe('0s');
  });

  it('rounds to nearest second', () => {
    expect(formatDuration(1_500)).toBe('2s');
  });

  it('handles exact minute', () => {
    expect(formatDuration(60_000)).toBe('1m 0s');
  });
});

describe('formatCompactDate', () => {
  it('formats ISO date as short month + day', () => {
    const result = formatCompactDate('2025-02-15T00:00:00Z');
    expect(result).toBe('Feb 15');
  });

  it('formats another date correctly', () => {
    const result = formatCompactDate('2025-12-01T12:00:00Z');
    expect(result).toBe('Dec 1');
  });
});
