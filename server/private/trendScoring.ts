import { SOURCE_WEIGHTS } from "./sourceWeights";

/**
 * Trend scoring engine.
 *
 * Produces a composite 0-100 score from three signals:
 *
 *   1. Base score        — the raw score carried on the trend row (set by
 *                          the source adapter at ingestion time, or 50 default).
 *   2. Price velocity    — positive velocity (price rising) boosts the score;
 *                          negative velocity (price dropping) penalises it.
 *   3. Source weight     — platforms deemed more reliable amplify the score.
 *   4. Snapshot depth    — more historical data = higher confidence.
 *
 * The confidence band reflects how much data backs the score:
 *   "high"   — >= 10 snapshots + defined velocity
 *   "medium" — >= 3  snapshots
 *   "low"    — < 3   snapshots
 */

export interface TrendScoringInput {
  rawScore: number;
  priceVelocity?: string | null;   // percent change e.g. "4.25" or "-1.10"
  sourcePlatform?: string | null;
  snapshotCount?: number;
}

export function calculateTrendScore(
  data: TrendScoringInput
): { trendScore: number; confidenceBand: "low" | "medium" | "high" } {
  const base = clamp(data.rawScore ?? 50, 0, 100);
  const velocity = parseFloat(data.priceVelocity ?? "0") || 0;
  const sourceKey = (data.sourcePlatform ?? "").toLowerCase();
  const snapshots = data.snapshotCount ?? 0;

  // Source weight multiplier: known platform gets its weight; unknown defaults to 0.10
  const sourceMultiplier = SOURCE_WEIGHTS[sourceKey] ?? 0.10;

  // Velocity contribution: cap at +/-15 points
  // Positive velocity → price is trending up → score boost
  const velocityContribution = clamp(velocity * 0.75, -15, 15);

  // Source amplification: scale base by weight (max +20 points for weight=0.30)
  const sourceContribution = base * sourceMultiplier * 0.65;

  // Raw composite
  const raw = base * 0.55 + sourceContribution + velocityContribution;
  const trendScore = Math.round(clamp(raw, 0, 100));

  // Confidence band
  let confidenceBand: "low" | "medium" | "high";
  if (snapshots >= 10 && data.priceVelocity != null) {
    confidenceBand = "high";
  } else if (snapshots >= 3) {
    confidenceBand = "medium";
  } else {
    confidenceBand = "low";
  }

  return { trendScore, confidenceBand };
}

function clamp(val: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, val));
}
