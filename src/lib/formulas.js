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

// goal: { target_cents, saved_cents, target_date?: Date, monthly_contribution_cents?: number }
// Returns one of:
//   { mode: 'target_date', requiredMonthlyCents, monthsRemaining }
//   { mode: 'contribution', monthsToGoal, projectedDate }
//   { mode: 'none' }  -- neither field set (or contribution is <= 0), honest empty state
export function goalProjection(goal, today = new Date()) {
  const remainingCents = goal.target_cents - goal.saved_cents;

  if (goal.target_date) {
    const monthsRemaining = monthsBetween(today, goal.target_date);
    const requiredMonthlyCents = Math.ceil(remainingCents / monthsRemaining);
    return { mode: 'target_date', requiredMonthlyCents, monthsRemaining };
  }

  if (goal.monthly_contribution_cents && goal.monthly_contribution_cents > 0) {
    const monthsToGoal = Math.max(0, Math.ceil(remainingCents / goal.monthly_contribution_cents));
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
