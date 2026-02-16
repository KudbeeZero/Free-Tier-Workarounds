/**
 * Weights used to blend trend signals from different platforms.
 * Higher weight = more influence on the composite trend score.
 * Must sum to 1.0 per category.
 */
export const SOURCE_WEIGHTS: Record<string, number> = {
  aliexpress: 0.30,
  tiktok: 0.25,
  temu: 0.15,
  shopify: 0.15,
  onchain: 0.15,
};
