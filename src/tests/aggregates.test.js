import { describe, it, expect } from 'vitest';
import { monthTotals, trailingMonthlyExpenseAverage, trailingMonthlyExpenseTotals, extrapolateMonthCents } from '../lib/aggregates.js';

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

  it('falls back to a day-elapsed projection of the current month when there is no prior history', () => {
    const events = [ev(15000, 'expense', 0)];
    const result = trailingMonthlyExpenseAverage(events, ref, 3); // ref = June 22 (day 22 of 30)
    expect(result.estimated).toBe(true);
    expect(result.average).toBe(Math.round((15000 / 22) * 30));
  });

  it('reports a zero estimate when nothing has been logged this month either', () => {
    const result = trailingMonthlyExpenseAverage([], ref, 3);
    expect(result).toEqual({ average: 0, estimated: true });
  });
});

describe('extrapolateMonthCents', () => {
  it('projects a full month from a single early day of spend', () => {
    const day1 = new Date(2026, 5, 1);
    expect(extrapolateMonthCents(1000, day1)).toBe(30000); // June has 30 days
  });

  it('projects less aggressively as more of the month has elapsed', () => {
    const day22 = new Date(2026, 5, 22);
    expect(extrapolateMonthCents(22000, day22)).toBe(30000);
  });
});

describe('trailingMonthlyExpenseTotals', () => {
  it('returns the 3 prior calendar months oldest-first, zero-filled', () => {
    const events = [ev(30000, 'expense', 1), ev(90000, 'expense', 3)];
    expect(trailingMonthlyExpenseTotals(events, ref, 3)).toEqual([90000, 0, 30000]);
  });
});
