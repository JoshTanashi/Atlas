// Aggregation helpers over raw financial_events rows, feeding the pure formulas in formulas.js.

// Atlas's fixed expense category set (shared with DetailExpander's category picker).
export const ALL_CATEGORIES = [
  'takeaways', 'groceries', 'fuel', 'health', 'airtime_data',
  'shopping', 'subscriptions', 'transport', 'uncategorized',
];

// Default essential/discretionary split, used unless a profile has its own
// essential_categories override (see essentialMonthlyExpenseAverage).
export const ESSENTIAL_CATEGORIES = ['groceries', 'fuel', 'health', 'transport', 'subscriptions', 'airtime_data'];
export const DISCRETIONARY_CATEGORIES = ['takeaways', 'shopping', 'uncategorized'];

// One fixed hue per category, used everywhere a category is shown (icons, charts,
// legends) so a category's color stays stable across screens and months instead
// of shifting with its rank in that month's breakdown.
export const CATEGORY_COLORS = {
  takeaways: '#B0734A',
  groceries: '#5B8C5A',
  fuel: '#C58A3D',
  health: '#A8534A',
  airtime_data: '#4F7A8C',
  shopping: '#8E6BA8',
  subscriptions: '#3E5950',
  transport: '#5B7B6F',
  uncategorized: '#8C9A8A',
};

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

// Projects a full month's total from partial-month spend, scaling by how far the reference
// date is into the month — the same trick period trackers use to estimate from day one
// instead of waiting for a full cycle of history.
export function extrapolateMonthCents(centsSoFar, referenceDate = new Date()) {
  const elapsedDays = referenceDate.getDate();
  const totalDays = new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0).getDate();
  return Math.round((centsSoFar / elapsedDays) * totalDays);
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
    // No prior months yet — extrapolate from the current (partial) month so the UI can show
    // an honest day-one estimate rather than a hard "no data" wall.
    const { expenseCents } = monthTotals(events, referenceDate);
    if (expenseCents === 0) return { average: 0, estimated: true };
    return { average: extrapolateMonthCents(expenseCents, referenceDate), estimated: true };
  }

  const average = totals.reduce((sum, v) => sum + v, 0) / totals.length;
  return { average, estimated: false };
}

// Same trailing window as trailingMonthlyExpenseAverage, but returned oldest-first (and
// including zero months) for feeding into a trend formula like forecastNextMonth.
export function trailingMonthlyExpenseTotals(events, referenceDate = new Date(), monthsBack = 3) {
  const totals = [];
  for (let i = monthsBack; i >= 1; i--) {
    const d = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - i, 1);
    const { expenseCents } = monthTotals(events, d);
    totals.push(expenseCents);
  }
  return totals;
}

// Same trailing-window/fallback shape as trailingMonthlyExpenseAverage, but summing only
// essential-category spend — the denominator for a "bare survival" runway figure, as opposed
// to the full-lifestyle one. essentialCategories defaults to ESSENTIAL_CATEGORIES but callers
// can pass a profile's own override (profiles.essential_categories).
export function essentialMonthlyExpenseAverage(events, referenceDate = new Date(), monthsBack = 3, essentialCategories = ESSENTIAL_CATEGORIES) {
  const essentialEvents = events.filter((e) => essentialCategories.includes(e.category));
  return trailingMonthlyExpenseAverage(essentialEvents, referenceDate, monthsBack);
}

// Trailing monthly expense totals with each month's known recurring-bill total subtracted
// (clamped at 0), isolating the unpredictable portion of spend so a trend forecast isn't
// thrown off by bills that are already known rather than estimated.
export function trailingVariableExpenseTotals(events, recurringExpenses, referenceDate = new Date(), monthsBack = 3) {
  const recurringTotalCents = recurringExpenses.reduce((sum, r) => sum + r.amount_cents, 0);
  return trailingMonthlyExpenseTotals(events, referenceDate, monthsBack).map((cents) =>
    Math.max(0, cents - recurringTotalCents)
  );
}

// Smooths the single-month savings rate over a trailing window so one irregular month
// (a bonus, a medical bill) doesn't swing the headline number. Income is currently a single
// static monthly figure in Atlas (not tracked historically), so this only smooths the
// expense side — still the dominant source of month-to-month noise.
export function trailingSavingsRateAverage(events, incomeCentsPerMonth, referenceDate = new Date(), monthsBack = 3) {
  if (!incomeCentsPerMonth) return null;

  const rates = [];
  for (let i = 1; i <= monthsBack; i++) {
    const d = new Date(referenceDate.getFullYear(), referenceDate.getMonth() - i, 1);
    const { expenseCents } = monthTotals(events, d);
    rates.push((incomeCentsPerMonth - expenseCents) / incomeCentsPerMonth);
  }

  return rates.reduce((sum, r) => sum + r, 0) / rates.length;
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
