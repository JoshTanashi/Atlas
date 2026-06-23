import { describe, it, expect } from 'vitest';
import { savingsRate, netWorth, runwayMonths, goalProjection, debtAmortization, debtPayoffPlan, forecastNextMonth, recentContributionPace } from '../lib/formulas.js';

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

describe('recentContributionPace', () => {
  it('R6,000 saved over 3 months -> R2,000/month pace', () => {
    const createdAt = new Date(2026, 0, 1);
    const today = new Date(2026, 3, 1); // ~3 months later
    expect(recentContributionPace(600_000, createdAt, today)).toBe(200_000);
  });

  it('floors at 1 month so a same-day goal does not divide by zero', () => {
    const createdAt = new Date(2026, 0, 1);
    expect(recentContributionPace(50_000, createdAt, createdAt)).toBe(50_000);
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

  it('target-date mode flags onTrack when recent pace meets the required contribution', () => {
    const today = new Date(2026, 0, 1);
    const goal = { target_cents: 5_000_000, saved_cents: 1_000_000, target_date: new Date(2026, 10, 1) };
    const result = goalProjection(goal, today, 500_000); // required is 400,000/month
    expect(result.onTrack).toBe(true);
    expect(result.paceMonthsToGoal).toBe(8);
  });

  it('target-date mode flags behind-pace when recent contribution falls short, with a later projected date', () => {
    const today = new Date(2026, 0, 1);
    const goal = { target_cents: 5_000_000, saved_cents: 1_000_000, target_date: new Date(2026, 10, 1) };
    const result = goalProjection(goal, today, 200_000); // required is 400,000/month
    expect(result.onTrack).toBe(false);
    expect(result.paceMonthsToGoal).toBe(20);
  });

  it('explicit apr: 0 matches the no-apr result exactly (regression guard)', () => {
    const today = new Date(2026, 0, 1);
    const goal = { target_cents: 5_000_000, saved_cents: 1_000_000, target_date: new Date(2026, 10, 1), apr: 0 };
    const result = goalProjection(goal, today);
    expect(result.requiredMonthlyCents).toBe(400_000);
    expect(result.monthsRemaining).toBe(10);
  });

  it('target-date mode requires a smaller monthly contribution when the saved balance earns interest', () => {
    const today = new Date(2026, 0, 1);
    const base = { target_cents: 5_000_000, saved_cents: 1_000_000, target_date: new Date(2026, 10, 1) };
    const noInterest = goalProjection(base, today).requiredMonthlyCents;
    const withInterest = goalProjection({ ...base, apr: 12 }, today).requiredMonthlyCents;
    expect(withInterest).toBeLessThan(noInterest);
  });

  it('target-date mode clamps requiredMonthlyCents to 0 when compounding alone already clears the target', () => {
    const today = new Date(2026, 0, 1);
    const goal = { target_cents: 1_000_000, saved_cents: 970_000, target_date: new Date(2026, 1, 1), apr: 60 };
    const result = goalProjection(goal, today);
    expect(result.requiredMonthlyCents).toBe(0);
  });

  it('contribution mode reaches the target sooner when the saved balance earns interest', () => {
    const today = new Date(2026, 0, 1);
    const base = { target_cents: 4_000_000, saved_cents: 0, monthly_contribution_cents: 300_000 };
    const noInterest = goalProjection(base, today).monthsToGoal;
    const withInterest = goalProjection({ ...base, apr: 12 }, today).monthsToGoal;
    expect(noInterest).toBe(14);
    expect(withInterest).toBe(13);
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

describe('debtPayoffPlan', () => {
  it('single debt matches debtAmortization\'s month count, with slightly less interest since the simulation caps the final payment at the remaining balance', () => {
    const debt = { id: 'd1', balance_cents: 2_000_000, apr: 18, monthly_payment_cents: 100_000 };
    const result = debtPayoffPlan([debt], 'avalanche');
    expect(result.amortizing).toBe(true);
    expect(result.months).toBe(24); // matches debtAmortization's ceil'd month count
    expect(result.totalInterestCents).toBeLessThan(400_000); // debtAmortization's closed-form total assumes a full final payment
    expect(result.totalInterestCents).toBeGreaterThan(390_000);
  });

  it('avalanche prioritizes the higher-APR debt first; snowball prioritizes the smaller balance first', () => {
    const debts = [
      { id: 'highApr', balance_cents: 800_000, apr: 30, monthly_payment_cents: 60_000 },
      { id: 'lowApr', balance_cents: 200_000, apr: 10, monthly_payment_cents: 20_000 },
    ];
    const avalanche = debtPayoffPlan(debts, 'avalanche');
    const snowball = debtPayoffPlan(debts, 'snowball');
    expect(avalanche.order[0]).toBe('highApr');
    expect(snowball.order[0]).toBe('lowApr');
    // Prioritizing interest cost (avalanche) never costs more total interest than snowball
    // for the same combined budget and debt set.
    expect(avalanche.totalInterestCents).toBeLessThanOrEqual(snowball.totalInterestCents);
  });

  it('budget that cannot cover interest never clears within the safety bound -> non-amortizing', () => {
    const debts = [{ id: 'd1', balance_cents: 2_000_000, apr: 18, monthly_payment_cents: 25_000 }];
    const result = debtPayoffPlan(debts, 'avalanche');
    expect(result.amortizing).toBe(false);
  });
});

describe('forecastNextMonth', () => {
  it('R100/R120/R140 trend -> R160 projected next month, with no band when the trend is exact', () => {
    const result = forecastNextMonth([10_000, 12_000, 14_000]);
    expect(result).toEqual({ expectedCents: 16_000, lowCents: 16_000, highCents: 16_000 });
  });

  it('flat trend projects the same value forward', () => {
    const result = forecastNextMonth([10_000, 10_000, 10_000]);
    expect(result).toEqual({ expectedCents: 10_000, lowCents: 10_000, highCents: 10_000 });
  });

  it('a single outlier month widens the band but does not skew the point estimate (Theil-Sen)', () => {
    const result = forecastNextMonth([10_000, 50_000, 14_000]);
    expect(result.expectedCents).toBe(16_000);
    expect(result.highCents).toBeGreaterThan(result.expectedCents);
  });

  it('single month of data passes through unchanged (no trend to fit)', () => {
    expect(forecastNextMonth([12_345])).toEqual({ expectedCents: 12_345, lowCents: 12_345, highCents: 12_345 });
  });

  it('no data returns null, not NaN', () => {
    expect(forecastNextMonth([])).toBeNull();
  });
});
