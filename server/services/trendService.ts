import { storage } from "../storage";
import { calculateTrendScore } from "../private/trendScoring";

export const trendService = {
  async getTrends(category?: string, search?: string) {
    const rawTrends = await storage.getTrends(category, search);
    return Promise.all(
      rawTrends.map(async (t) => {
        const snapshotCount = await storage.getSnapshotCount(t.id);
        const { trendScore, confidenceBand } = calculateTrendScore({
          rawScore: t.trendScore,
          priceVelocity: t.priceVelocity,
          sourcePlatform: t.sourcePlatform,
          snapshotCount,
        });
        return { ...t, trendScore, confidenceBand };
      })
    );
  },

  async getTrend(id: number) {
    const trend = await storage.getTrend(id);
    if (!trend) return null;
    const snapshotCount = await storage.getSnapshotCount(id);
    const { trendScore, confidenceBand } = calculateTrendScore({
      rawScore: trend.trendScore,
      priceVelocity: trend.priceVelocity,
      sourcePlatform: trend.sourcePlatform,
      snapshotCount,
    });
    return { ...trend, trendScore, confidenceBand };
  },
};
