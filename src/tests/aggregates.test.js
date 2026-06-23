import { describe, it, expect } from 'vitest';
import {
  monthTotals,
  trailingMonthlyExpenseAverage,
  trailingMonthlyExpenseTotals,
  extrapolateMonthCents,
  essentialMonthlyExpenseAverage,
  trailingVariableExpenseTotals,
  trailingSavingsRateAverage,
} from '../lib/aggregates.js';

const ref = new Date(2026, 5, 22); // June 22, 2026

function ev(amount, direction, monthsAgo, day = 5, category = 'uncategorized') {
  const d = new Date(ref.getFullYear(), ref.getMonth() - monthsAgo, day);
  return { amount_cents: amount, direction, occurred_at: d.toISOString(), category };
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

describe('essentialMonthlyExpenseAverage', () => {
  it('averages only essential-category spend, ignoring discretionary categories', () => {
    const events = [
      ev(30000, 'expense', 1, 5, 'groceries'),
      ev(50000, 'expense', 1, 6, 'takeaways'),
      ev(30000, 'expense', 2, 5, 'transport'),
    ];
    const result = essentialMonthlyExpenseAverage(events, ref, 3);
    expect(result.average).toBe(30000);
    expect(result.estimated).toBe(false);
  });
});

describe('trailingVariableExpenseTotals', () => {
  it('subtracts known recurring bills from each trailing month, clamped at zero', () => {
    const events = [ev(90000, 'expense', 1), ev(30000, 'expense', 2)];
    const recurringExpenses = [{ amount_cents: 40000 }, { amount_cents: 10000 }]; // 50,000/mo known fixed
    expect(trailingVariableExpenseTotals(events, recurringExpenses, ref, 3)).toEqual([0, 0, 40000]);
  });
});

describe('trailingSavingsRateAverage', () => {
  it('averages savings rate over the trailing window against a fixed monthly income', () => {
    const events = [ev(800000, 'expense', 1), ev(600000, 'expense', 2), ev(700000, 'expense', 3)];
    const result = trailingSavingsRateAverage(events, 1_000_000, ref, 3);
    expect(result).toBeCloseTo(0.3, 5); // mean of 0.2, 0.4, 0.3
  });

  it('zero income returns null (no division by zero)', () => {
    expect(trailingSavingsRateAverage([], 0, ref, 3)).toBeNull();
  });
});
