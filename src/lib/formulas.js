// All money amounts are integer cents. Dates are JS Date objects unless noted.

export function savingsRate(incomeCents, expenseCents) {
  if (!incomeCents) return null;
  return (incomeCents - expenseCents) / incomeCents;
}

export function netWorth(accounts, debts) {
  const assets = accounts.reduce((sum, a) => sum + a.balance_cents, 0);
  const liabilities = debts.reduce((sum, d) => sum + d.balance_cents, 0);
  return assets - liabilities;
}

// avgMonthlyExpenseCents should be the trailing-window average expense; callers compute that window.
export function runwayMonths(liquidBalanceCents, avgMonthlyExpenseCents) {
  if (!avgMonthlyExpenseCents) return null;
  return liquidBalanceCents / avgMonthlyExpenseCents;
}

function monthsBetween(today, targetDate) {
  const months =
    (targetDate.getFullYear() - today.getFullYear()) * 12 +
    (targetDate.getMonth() - today.getMonth());
  return Math.max(1, months);
}

// Approximates a goal's recent monthly saving pace from its own history (total saved so far
// over time since creation) -- Atlas doesn't log a separate contribution timeline. Floored at
// 1 month so a same-day goal doesn't divide by zero. Feeds goalProjection's optional
// recentMonthlyContributionCents input.
export function recentContributionPace(savedCents, createdAt, today = new Date()) {
  const monthsSinceCreated = Math.max(1, (today.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24 * 30));
  return Math.round(savedCents / monthsSinceCreated);
}

// Months (>= 0) for savedCents, compounding monthly at monthlyRate, plus a fixed monthly
// contribution, to reach targetCents. monthlyRate === 0 falls back to plain linear division.
// Standard ordinary-annuity future-value formula (FV = PV(1+r)^n + PMT[((1+r)^n-1)/r]) solved for n.
function monthsToReachTarget(savedCents, targetCents, contributionCents, monthlyRate) {
  const remaining = targetCents - savedCents;
  if (remaining <= 0) return 0;
  if (monthlyRate === 0) return Math.ceil(remaining / contributionCents);

  const numerator = targetCents + contributionCents / monthlyRate;
  const denominator = savedCents + contributionCents / monthlyRate;
  const n = Math.log(numerator / denominator) / Math.log(1 + monthlyRate);
  return Math.max(0, Math.ceil(n));
}

// goal: { target_cents, saved_cents, target_date?: Date, monthly_contribution_cents?: number, apr?: number }
// apr (optional): annual interest rate the goal's saved balance earns, as a plain percentage
// (e.g. 5.5), same convention as debts. Omitted/zero keeps the projection purely linear.
// recentMonthlyContributionCents (optional): the goal's actual recent saving pace, used only
// in target_date mode to flag whether the stated target is realistic given real behavior.
// Returns one of:
//   { mode: 'target_date', requiredMonthlyCents, monthsRemaining, onTrack?, paceMonthsToGoal?, paceProjectedDate? }
//   { mode: 'contribution', monthsToGoal, projectedDate }
//   { mode: 'none' }  -- neither field set (or contribution is <= 0), honest empty state
export function goalProjection(goal, today = new Date(), recentMonthlyContributionCents = null) {
  const remainingCents = goal.target_cents - goal.saved_cents;
  const monthlyRate = (goal.apr || 0) / 12 / 100;

  if (goal.target_date) {
    const monthsRemaining = monthsBetween(today, goal.target_date);
    let requiredMonthlyCents;
    if (monthlyRate === 0) {
      requiredMonthlyCents = Math.ceil(remainingCents / monthsRemaining);
    } else {
      const growthFactor = Math.pow(1 + monthlyRate, monthsRemaining);
      const futureSavedCents = goal.saved_cents * growthFactor;
      const annuityFactor = (growthFactor - 1) / monthlyRate;
      requiredMonthlyCents = Math.max(0, Math.ceil((goal.target_cents - futureSavedCents) / annuityFactor));
    }
    const result = { mode: 'target_date', requiredMonthlyCents, monthsRemaining };

    if (recentMonthlyContributionCents !== null) {
      result.onTrack = recentMonthlyContributionCents >= requiredMonthlyCents;
      if (recentMonthlyContributionCents > 0) {
        result.paceMonthsToGoal = monthsToReachTarget(goal.saved_cents, goal.target_cents, recentMonthlyContributionCents, monthlyRate);
        result.paceProjectedDate = new Date(today.getFullYear(), today.getMonth() + result.paceMonthsToGoal, today.getDate());
      }
    }

    return result;
  }

  if (goal.monthly_contribution_cents && goal.monthly_contribution_cents > 0) {
    const monthsToGoal = monthsToReachTarget(goal.saved_cents, goal.target_cents, goal.monthly_contribution_cents, monthlyRate);
    const projectedDate = new Date(today.getFullYear(), today.getMonth() + monthsToGoal, today.getDate());
    return { mode: 'contribution', monthsToGoal, projectedDate };
  }

  return { mode: 'none' };
}

// debt: { balance_cents, apr, monthly_payment_cents }
// Returns one of:
//   { amortizing: false }  -- payment doesn't exceed monthly interest, will never pay off
//   { amortizing: true, months, totalInterestCents }
export function debtAmortization(debt) {
  const monthlyRate = debt.apr / 12 / 100;
  const interestOnlyCents = debt.balance_cents * monthlyRate;

  if (!debt.monthly_payment_cents || debt.monthly_payment_cents <= interestOnlyCents) {
    return { amortizing: false };
  }

  if (monthlyRate === 0) {
    const months = Math.ceil(debt.balance_cents / debt.monthly_payment_cents);
    return { amortizing: true, months, totalInterestCents: 0 };
  }

  const months = Math.ceil(
    -Math.log(1 - (debt.balance_cents * monthlyRate) / debt.monthly_payment_cents) /
      Math.log(1 + monthlyRate)
  );
  const totalInterestCents = debt.monthly_payment_cents * months - debt.balance_cents;

  return { amortizing: true, months, totalInterestCents };
}

// debts: array of debts that already have monthly_payment_cents set (filter before calling).
// strategy: 'avalanche' (highest APR first) or 'snowball' (smallest balance first). Simulates
// month-by-month, accruing interest then allocating the combined monthly budget (sum of every
// debt's monthly_payment_cents) in priority order, so a paid-off debt's payment automatically
// rolls into the next-priority debt. Returns one of:
//   { amortizing: false }  -- budget can't clear all debts within maxMonths
//   { amortizing: true, months, totalInterestCents, order }  -- order is payoff sequence (debt ids)
export function debtPayoffPlan(debts, strategy, maxMonths = 600) {
  const totalBudgetCents = debts.reduce((sum, d) => sum + (d.monthly_payment_cents || 0), 0);
  if (totalBudgetCents <= 0 || debts.length === 0) return { amortizing: false };

  let states = debts.map((d, i) => ({
    id: d.id ?? i,
    balanceCents: d.balance_cents,
    monthlyRate: d.apr / 12 / 100,
    apr: d.apr,
  }));

  let totalInterestCents = 0;
  const order = [];

  for (let month = 1; month <= maxMonths; month++) {
    for (const s of states) {
      const interest = s.balanceCents * s.monthlyRate;
      s.balanceCents += interest;
      totalInterestCents += interest;
    }

    const sorted = [...states].sort((a, b) =>
      strategy === 'avalanche' ? b.apr - a.apr : a.balanceCents - b.balanceCents
    );

    let budget = totalBudgetCents;
    for (const s of sorted) {
      const pay = Math.min(budget, s.balanceCents);
      s.balanceCents -= pay;
      budget -= pay;
    }

    for (const s of states) {
      if (s.balanceCents <= 0) order.push(s.id);
    }
    states = states.filter((s) => s.balanceCents > 0);

    if (states.length === 0) {
      return { amortizing: true, months: month, totalInterestCents: Math.round(totalInterestCents), order };
    }
  }

  return { amortizing: false };
}

// variableTrailingCents: totals (oldest first) for however many recent months are available,
// with known recurring bills already subtracted by the caller (see aggregates.js
// trailingVariableExpenseTotals) -- this fits a trend through the unpredictable portion only.
// Uses Theil-Sen (median of pairwise slopes) instead of OLS so a single outlier month doesn't
// skew the whole trend, and reports a band from the largest residual rather than a bare point.
// Returns null with no data (honest empty state); a single month just passes through (no trend to fit).
export function forecastNextMonth(variableTrailingCents) {
  const n = variableTrailingCents.length;
  if (n === 0) return null;
  if (n === 1) {
    const v = variableTrailingCents[0];
    return { expectedCents: v, lowCents: v, highCents: v };
  }

  const median = (values) => {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  };

  const slopes = [];
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      slopes.push((variableTrailingCents[j] - variableTrailingCents[i]) / (j - i));
    }
  }
  const slope = median(slopes);
  const intercept = median(variableTrailingCents.map((y, x) => y - slope * x));

  const residuals = variableTrailingCents.map((y, x) => Math.abs(y - (intercept + slope * x)));
  const band = Math.round(Math.max(...residuals));
  const expectedCents = Math.round(intercept + slope * n);

  return {
    expectedCents,
    lowCents: Math.max(0, expectedCents - band),
    highCents: expectedCents + band,
  };
}
