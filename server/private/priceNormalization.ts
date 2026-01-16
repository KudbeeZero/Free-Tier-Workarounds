export function normalizePrices(snapshots: any[]): { percentile: number; label: "cheap" | "neutral" | "expensive" } {
  // Proprietary normalization logic (stubbed for MVP)
  const percentile = 75; // Mock value
  const label = percentile > 80 ? "expensive" : percentile < 30 ? "cheap" : "neutral";
  
  return { percentile, label };
}
