/**
 * Price normalization engine.
 *
 * Given an array of historical price snapshots for a single trend,
 * computes where the *current* price sits relative to the observed
 * range and returns a percentile (0-100) plus a human-readable label.
 *
 * Percentile semantics:
 *   0   = at the historical low  (cheapest we've ever seen)
 *   50  = mid-range
 *   100 = at or above the historical high
 */

interface Snapshot {
  price: string;
  recordedAt: Date | string;
}

export function normalizePrices(
  snapshots: Snapshot[]
): { percentile: number; label: "cheap" | "neutral" | "expensive" } {
  if (snapshots.length === 0) {
    return { percentile: 50, label: "neutral" };
  }

  const prices = snapshots
    .map((s) => parseFloat(s.price))
    .filter((p) => Number.isFinite(p) && p >= 0);

  if (prices.length === 0) {
    return { percentile: 50, label: "neutral" };
  }

  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const current = prices[prices.length - 1]; // most recent price

  // If all prices are identical the product hasn't moved — call it neutral
  const range = max - min;
  const percentile =
    range === 0 ? 50 : Math.round(((current - min) / range) * 100);

  let label: "cheap" | "neutral" | "expensive";
  if (percentile <= 30) {
    label = "cheap";
  } else if (percentile >= 70) {
    label = "expensive";
  } else {
    label = "neutral";
  }

  return { percentile, label };
}
