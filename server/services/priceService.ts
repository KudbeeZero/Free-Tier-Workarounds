import { storage } from "../storage";
import { normalizePrices } from "../private/priceNormalization";

export const priceService = {
  async getTrendPrices(trendId: number) {
    const snapshots = await storage.getPriceSnapshots(trendId);
    const { percentile, label } = normalizePrices(snapshots);
    return {
      snapshots,
      intelligence: { percentile, label }
    };
  }
};
