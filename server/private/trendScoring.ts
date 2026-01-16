export function calculateTrendScore(data: any): { trendScore: number; confidenceBand: "low" | "medium" | "high" } {
  // Proprietary scoring logic (stubbed for MVP)
  const score = Math.min(100, Math.max(0, data.rawScore || 50));
  let confidence: "low" | "medium" | "high" = "medium";
  if (score > 80) confidence = "high";
  if (score < 30) confidence = "low";
  
  return { trendScore: score, confidenceBand: confidence };
}
