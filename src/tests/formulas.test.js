import { describe, it, expect } from 'vitest';
import { savingsRate, netWorth, runwayMonths, goalProjection, debtAmortization, forecastNextMonthCents } from '../lib/formulas.js';

describe('savingsRate', () => {
  it('R20,000 income, R15,000 expense -> 25.0%', () => {
    expect(savingsRate(2_000_000, 1_500_000)).toBeCloseTo(0.25, 5);
  });

  it('overspending shows an honest negative rate', () => {
    expect(savingsRate(1_000_000, 1_200_000)).toBeCloseTo(-0.2, 5);
  });

  it('zero income returns null (no division by zero)', () => {
    expect(savingsRate(0, 500_000)).toBeNull();
  });
});

describe('netWorth', () => {
  it('R60,000 accounts - R20,000 debt -> R40,000', () => {
    const accounts = [{ balance_cents: 5_000_000 }, { balance_cents: 1_000_000 }];
    const debts = [{ balance_cents: 2_000_000 }];
    expect(netWorth(accounts, debts)).toBe(4_000_000);
  });

  it('handles no debts', () => {
    expect(netWorth([{ balance_cents: 1_000 }], [])).toBe(1_000);
  });
});

describe('runwayMonths', () => {
  it('R60,000 liquid / R15,000 avg monthly expense -> 4.0 months', () => {
    expect(runwayMonths(6_000_000, 1_500_000)).toBeCloseTo(4.0, 5);
  });

  it('zero average expense returns null (no division by zero / Infinity)', () => {
    expect(runwayMonths(6_000_000, 0)).toBeNull();
  });
});

describe('goalProjection', () => {
  it('target-date mode: R50,000 target, R10,000 saved, 10 months away -> R4,000/month required', () => {
    const today = new Date(2026, 0, 1);
    const goal = { target_cents: 5_000_000, saved_cents: 1_000_000, target_date: new Date(2026, 10, 1) };
    const result = goalProjection(goal, today);
    expect(result.mode).toBe('target_date');
    expect(result.requiredMonthlyCents).toBe(400_000);
    expect(result.monthsRemaining).toBe(10);
  });

  it('contribution mode: R40,000 remaining, R5,000/month -> 8 months', () => {
    const today = new Date(2026, 0, 1);
    const goal = { target_cents: 4_000_000, saved_cents: 0, monthly_contribution_cents: 500_000 };
    const result = goalProjection(goal, today);
    expect(result.mode).toBe('contribution');
    expect(result.monthsToGoal).toBe(8);
    expect(result.projectedDate.getMonth()).toBe(8); // Jan(0) + 8 = Sep(8)
  });

  it('neither field set -> honest empty state, no fabricated number', () => {
    const goal = { target_cents: 1_000_000, saved_cents: 0 };
    expect(goalProjection(goal).mode).toBe('none');
  });

  it('zero/negative contribution treated as unset, not divide-by-zero', () => {
    const goal = { target_cents: 1_000_000, saved_cents: 0, monthly_contribution_cents: 0 };
    expect(goalProjection(goal).mode).toBe('none');
  });
});

describe('debtAmortization', () => {
  it('R20,000 @ 18% APR, R1,000/month -> 24 months, R4,000 total interest (canonical example)', () => {
    const result = debtAmortization({ balance_cents: 2_000_000, apr: 18, monthly_payment_cents: 100_000 });
    expect(result.amortizing).toBe(true);
    expect(result.months).toBe(24);
    expect(result.totalInterestCents).toBe(400_000);
  });

  it('payment below interest-only threshold flags as non-amortizing, not NaN/Infinity', () => {
    const result = debtAmortization({ balance_cents: 2_000_000, apr: 18, monthly_payment_cents: 25_000 });
    expect(result.amortizing).toBe(false);
  });

  it('payment exactly at the interest-only threshold also flags as non-amortizing', () => {
    // monthlyRate = 0.015, interest-only = 2_000_000 * 0.015 = 30_000
    const result = debtAmortization({ balance_cents: 2_000_000, apr: 18, monthly_payment_cents: 30_000 });
    expect(result.amortizing).toBe(false);
  });

  it('0% APR debt amortizes linearly with no interest', () => {
    const result = debtAmortization({ balance_cents: 1_000_000, apr: 0, monthly_payment_cents: 100_000 });
    expect(result.amortizing).toBe(true);
    expect(result.months).toBe(10);
    expect(result.totalInterestCents).toBe(0);
  });

  it('no monthly_payment_cents set flags as non-amortizing', () => {
    const result = debtAmortization({ balance_cents: 1_000_000, apr: 18, monthly_payment_cents: null });
    expect(result.amortizing).toBe(false);
  });
});

describe('forecastNextMonthCents', () => {
  it('R100/R120/R140 trend -> R160 projected next month', () => {
    expect(forecastNextMonthCents([10_000, 12_000, 14_000])).toBe(16_000);
  });

  it('flat trend projects the same value forward', () => {
    expect(forecastNextMonthCents([10_000, 10_000, 10_000])).toBe(10_000);
  });

  it('single month of data passes through unchanged (no trend to fit)', () => {
    expect(forecastNextMonthCents([12_345])).toBe(12_345);
  });

  it('no data returns null, not NaN', () => {
    expect(forecastNextMonthCents([])).toBeNull();
  });
});
