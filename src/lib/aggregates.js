// Aggregation helpers over raw financial_events rows, feeding the pure formulas in formulas.js.

function isSameMonth(date, year, month) {
  return date.getFullYear() === year && date.getMonth() === month;
}

export function monthTotals(events, referenceDate = new Date()) {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();

  let expenseCents = 0;
  let incomeCents = 0;

  for (const event of events) {
    const occurred = new Date(event.occurred_at);
    if (!isSameMonth(occurred, year, month)) continue;
    if (event.direction === 'expense') expenseCents += event.amount_cents;
    else incomeCents += event.amount_cents;
  }

  return { expenseCents, incomeCents };
}

// Average expense over the trailing `monthsBack` calendar months (excluding the current,
// possibly-partial month), used as the denominator for the runway formula.
export function trailingMonthlyExpenseAverage(events, referenceDate = new Date(), monthsBack = 3) {
  const totals = [];

  for (let i = 1; i <= monthsBack; i++) {
    const d = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - i, 1);
    const { expenseCents } = monthTotals(events, d);
    if (expenseCents > 0) totals.push(expenseCents);
  }

  if (totals.length === 0) {
    // Not enough history — fall back to the current (partial) month so the UI can show an
    // honest "estimate based on limited history" rather than a hard "no data" wall.
    const { expenseCents } = monthTotals(events, referenceDate);
    return expenseCents > 0 ? { average: expenseCents, estimated: true } : { average: 0, estimated: true };
  }

  const average = totals.reduce((sum, v) => sum + v, 0) / totals.length;
  return { average, estimated: false };
}

// Same trailing window as trailingMonthlyExpenseAverage, but returned oldest-first (and
// including zero months) for feeding into a trend formula like forecastNextMonthCents.
export function trailingMonthlyExpenseTotals(events, referenceDate = new Date(), monthsBack = 3) {
  const totals = [];
  for (let i = monthsBack; i >= 1; i--) {
    const d = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - i, 1);
    const { expenseCents } = monthTotals(events, d);
    totals.push(expenseCents);
  }
  return totals;
}

// Current-month expense totals grouped by category, sorted highest first.
export function categoryBreakdown(events, referenceDate = new Date()) {
  const year = referenceDate.getFullYear();
  const month = referenceDate.getMonth();
  const totals = new Map();

  for (const event of events) {
    if (event.direction !== 'expense') continue;
    const occurred = new Date(event.occurred_at);
    if (!isSameMonth(occurred, year, month)) continue;
    totals.set(event.category, (totals.get(event.category) ?? 0) + event.amount_cents);
  }

  return [...totals.entries()]
    .map(([category, cents]) => ({ category, cents }))
    .sort((a, b) => b.cents - a.cents);
}
