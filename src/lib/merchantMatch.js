import dictionary from '../data/merchantDictionary.json';

export const UNCATEGORIZED = 'uncategorized';

export function normalizeMerchant(merchant) {
  return merchant
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ');
}

function levenshtein(a, b) {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const dist = Array.from({ length: rows }, (_, i) => [i, ...Array(cols - 1).fill(0)]);
  for (let j = 0; j < cols; j++) dist[0][j] = j;

  for (let i = 1; i < rows; i++) {
    for (let j = 1; j < cols; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dist[i][j] = Math.min(dist[i - 1][j] + 1, dist[i][j - 1] + 1, dist[i - 1][j - 1] + cost);
    }
  }
  return dist[rows - 1][cols - 1];
}

// corrections: a plain object map of normalized merchant string -> category, supplied by the caller
// (loaded from the user's merchant_corrections, cache-first).
export function matchMerchant(merchant, corrections = {}) {
  const key = normalizeMerchant(merchant);
  if (!key) return UNCATEGORIZED;

  if (corrections[key]) return corrections[key];

  // Fast path: substring containment either direction.
  for (const entry of dictionary) {
    if (key.includes(entry.pattern) || entry.pattern.includes(key)) {
      return entry.category;
    }
  }

  // Fuzzy fallback: short edit-distance against any dictionary pattern, scaled to pattern length
  // so longer merchant names tolerate more typos without false-matching short ones.
  let best = null;
  let bestDistance = Infinity;
  for (const entry of dictionary) {
    const distance = levenshtein(key, entry.pattern);
    if (distance < bestDistance) {
      bestDistance = distance;
      best = entry;
    }
  }

  const threshold = Math.max(1, Math.floor((best?.pattern.length ?? 0) * 0.25));
  if (best && bestDistance <= threshold) {
    return best.category;
  }

  return UNCATEGORIZED;
}
