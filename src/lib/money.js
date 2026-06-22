export function centsToRands(cents) {
  return cents / 100;
}

export function randsToCents(rands) {
  return Math.round(rands * 100);
}

// Manual formatting (not Intl) so output is predictable and easy to unit test:
// e.g. formatRands(123456) -> "R1,234.56", formatRands(-500) -> "-R5.00"
export function formatRands(cents) {
  const negative = cents < 0;
  const abs = Math.abs(cents);
  const rands = Math.floor(abs / 100);
  const remainderCents = abs % 100;
  const withThousands = rands.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const decimals = remainderCents.toString().padStart(2, '0');
  return `${negative ? '-' : ''}R${withThousands}.${decimals}`;
}

// Live-formats a whole-rand integer (no decimals) with thousands separators, for the amount keypad.
export function formatWholeRands(rands) {
  return rands.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}
