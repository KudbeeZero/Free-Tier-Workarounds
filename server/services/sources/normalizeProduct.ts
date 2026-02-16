/**
 * Canonical product format and normalization utilities.
 *
 * Every data source (AliExpress, TikTok, Temu, Shopify, etc.) must
 * convert its raw response into CanonicalProduct objects before handing
 * them to the ingestion engine.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SourcePlatform = "aliexpress" | "tiktok" | "temu" | "shopify";

export interface CanonicalProduct {
  externalId: string;
  title: string;
  source: SourcePlatform;
  price: number;
  currency: string;
  imageUrl: string;
  productUrl: string;
  category: string;
}

/**
 * Contract every source adapter must implement.
 *
 * `name`    – lowercase key used for logging & dedup (must match SourcePlatform).
 * `fetch`   – returns a batch of products in canonical format.
 *             May throw; callers are expected to handle errors per-source.
 */
export interface ProductSource {
  name: SourcePlatform;
  fetch(): Promise<CanonicalProduct[]>;
}

// ---------------------------------------------------------------------------
// Normalization helpers
// ---------------------------------------------------------------------------

const VALID_CATEGORIES = new Set([
  "Electronics",
  "Home & Garden",
  "Pet Supplies",
  "Fashion",
  "Beauty",
  "Sports & Outdoors",
  "Toys & Games",
  "Automotive",
  "Health",
  "Other",
]);

/**
 * Sanitise and validate a raw product object coming from any source.
 * Returns `null` if required fields are missing or obviously invalid so
 * the caller can skip it without crashing the whole batch.
 */
export function normalizeProduct(raw: Partial<CanonicalProduct>): CanonicalProduct | null {
  if (!raw.externalId || !raw.title || !raw.source || raw.price == null) {
    return null;
  }

  const price = Number(raw.price);
  if (!Number.isFinite(price) || price < 0) {
    return null;
  }

  const category = raw.category && VALID_CATEGORIES.has(raw.category)
    ? raw.category
    : "Other";

  return {
    externalId: String(raw.externalId).trim(),
    title: String(raw.title).trim().slice(0, 500),
    source: raw.source,
    price,
    currency: (raw.currency ?? "USD").toUpperCase().slice(0, 3),
    imageUrl: raw.imageUrl ?? "",
    productUrl: raw.productUrl ?? "",
    category,
  };
}
