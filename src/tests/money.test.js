import { describe, it, expect } from 'vitest';
import { centsToRands, randsToCents, formatRands, formatWholeRands } from '../lib/money.js';

describe('money conversions', () => {
  it('converts cents to rands and back without drift', () => {
    expect(centsToRands(150_000)).toBe(1500);
    expect(randsToCents(1500)).toBe(150_000);
    expect(randsToCents(19.99)).toBe(1999);
  });
});

describe('formatRands', () => {
  it('formats with thousands separator and two decimals', () => {
    expect(formatRands(123_456)).toBe('R1,234.56');
    expect(formatRands(500)).toBe('R5.00');
    expect(formatRands(99)).toBe('R0.99');
  });

  it('formats negative amounts honestly, not clamped to zero', () => {
    expect(formatRands(-50_000)).toBe('-R500.00');
  });
});

describe('formatWholeRands', () => {
  it('adds thousands separators to a whole-rand integer', () => {
    expect(formatWholeRands(1234567)).toBe('1,234,567');
    expect(formatWholeRands(50)).toBe('50');
  });
});
