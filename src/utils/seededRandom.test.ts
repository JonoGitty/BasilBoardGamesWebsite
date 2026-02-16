import { describe, it, expect } from 'vitest';
import { mulberry32, hashSeed, seededShuffle } from './seededRandom';

describe('seededRandom', () => {
  it('mulberry32 produces deterministic output', () => {
    const rng1 = mulberry32(42);
    const rng2 = mulberry32(42);
    const seq1 = Array.from({ length: 10 }, () => rng1());
    const seq2 = Array.from({ length: 10 }, () => rng2());
    expect(seq1).toEqual(seq2);
  });

  it('different seeds produce different output', () => {
    const rng1 = mulberry32(1);
    const rng2 = mulberry32(2);
    expect(rng1()).not.toBe(rng2());
  });

  it('hashSeed is deterministic', () => {
    expect(hashSeed('rotation-2026-02-16')).toBe(hashSeed('rotation-2026-02-16'));
  });

  it('hashSeed varies with input', () => {
    expect(hashSeed('rotation-2026-02-16')).not.toBe(hashSeed('rotation-2026-02-17'));
  });

  it('seededShuffle is deterministic', () => {
    const items = ['a', 'b', 'c', 'd', 'e'];
    const s1 = seededShuffle(items, 'test-seed');
    const s2 = seededShuffle(items, 'test-seed');
    expect(s1).toEqual(s2);
  });

  it('seededShuffle does not mutate input', () => {
    const items = ['a', 'b', 'c', 'd', 'e'];
    const original = [...items];
    seededShuffle(items, 'test-seed');
    expect(items).toEqual(original);
  });

  it('seededShuffle contains all original elements', () => {
    const items = ['a', 'b', 'c', 'd', 'e'];
    const shuffled = seededShuffle(items, 'test-seed');
    expect(shuffled.sort()).toEqual([...items].sort());
  });
});
