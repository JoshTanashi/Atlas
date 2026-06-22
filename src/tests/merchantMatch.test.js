import { describe, it, expect } from 'vitest';
import { matchMerchant, normalizeMerchant } from '../lib/merchantMatch.js';

describe('matchMerchant', () => {
  it('matches known SA merchants to the right category', () => {
    expect(matchMerchant('Nando\'s Sandton')).toBe('takeaways');
    expect(matchMerchant('Checkers Hyper')).toBe('groceries');
    expect(matchMerchant('Engen Garage')).toBe('fuel');
    expect(matchMerchant('Clicks Pharmacy')).toBe('health');
    expect(matchMerchant('Vodacom')).toBe('airtime_data');
    expect(matchMerchant('Takealot.com')).toBe('shopping');
    expect(matchMerchant('Netflix.com')).toBe('subscriptions');
    expect(matchMerchant('Uber Trip')).toBe('transport');
  });

  it('falls back to uncategorized for unknown merchants', () => {
    expect(matchMerchant('Some Random Shop XYZ')).toBe('uncategorized');
  });

  it('tolerates small typos via fuzzy fallback', () => {
    expect(matchMerchant('Vodacm')).toBe('airtime_data');
  });

  it('prefers a learned user correction over the dictionary', () => {
    const corrections = { nandos: 'dining_out' };
    expect(matchMerchant("Nando's", corrections)).toBe('dining_out');
  });

  it('handles empty input safely', () => {
    expect(matchMerchant('   ')).toBe('uncategorized');
  });
});

describe('normalizeMerchant', () => {
  it('trims and lowercases', () => {
    expect(normalizeMerchant('  KFC Rosebank  ')).toBe('kfc rosebank');
  });
});
