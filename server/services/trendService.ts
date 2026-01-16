import { storage } from "../storage";
import { calculateTrendScore } from "../private/trendScoring";

export const trendService = {
  async getTrends(category?: string, search?: string) {
    const rawTrends = await storage.getTrends(category, search);
    return rawTrends.map(t => {
      const { trendScore, confidenceBand } = calculateTrendScore({ rawScore: t.trendScore });
      return {
        ...t,
        trendScore,
        confidenceBand
      };
    });
  },

  async getTrend(id: number) {
    const trend = await storage.getTrend(id);
    if (!trend) return null;
    const { trendScore, confidenceBand } = calculateTrendScore({ rawScore: trend.trendScore });
    return {
      ...trend,
      trendScore,
      confidenceBand
    };
  }
};
