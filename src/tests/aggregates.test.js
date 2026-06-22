import { describe, it, expect } from 'vitest';
import { monthTotals, trailingMonthlyExpenseAverage, trailingMonthlyExpenseTotals } from '../lib/aggregates.js';

const ref = new Date(2026, 5, 22); // June 22, 2026

function ev(amount, direction, monthsAgo, day = 5) {
  const d = new Date(ref.getFullYear(), ref.getMonth() - monthsAgo, day);
  return { amount_cents: amount, direction, occurred_at: d.toISOString() };
}

describe('monthTotals', () => {
  it('sums expenses and income for the reference month only', () => {
    const events = [ev(10000, 'expense', 0), ev(5000, 'income', 0), ev(99999, 'expense', 1)];
    expect(monthTotals(events, ref)).toEqual({ expenseCents: 10000, incomeCents: 5000 });
  });
});

describe('trailingMonthlyExpenseAverage', () => {
  it('averages the 3 prior calendar months', () => {
    const events = [ev(30000, 'expense', 1), ev(60000, 'expense', 2), ev(90000, 'expense', 3)];
    const result = trailingMonthlyExpenseAverage(events, ref, 3);
    expect(result.average).toBe(60000);
    expect(result.estimated).toBe(false);
  });

  it('falls back to current-month estimate when there is no prior history', () => {
    const events = [ev(15000, 'expense', 0)];
    const result = trailingMonthlyExpenseAverage(events, ref, 3);
    expect(result.estimated).toBe(true);
    expect(result.average).toBe(15000);
  });
});

describe('trailingMonthlyExpenseTotals', () => {
  it('returns the 3 prior calendar months oldest-first, zero-filled', () => {
    const events = [ev(30000, 'expense', 1), ev(90000, 'expense', 3)];
    expect(trailingMonthlyExpenseTotals(events, ref, 3)).toEqual([90000, 0, 30000]);
  });
});
