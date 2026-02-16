/**
 * AliExpress product source adapter.
 *
 * Production path:
 *   Replace `fetchFromAPI()` with a real AliExpress Affiliate API call
 *   (or a scraping pipeline that returns the same shape).
 *   The rest of the adapter — normalisation, dedup, category mapping — stays.
 *
 * The structured stub below returns realistic product data so the full
 * ingestion pipeline exercises all code paths in dev/staging without
 * depending on an external service.
 */

import type { CanonicalProduct, ProductSource } from "./normalizeProduct";

// ---------------------------------------------------------------------------
// Category mapping — AliExpress uses numeric IDs; we map to our canonical set
// ---------------------------------------------------------------------------

const CATEGORY_MAP: Record<string, string> = {
  "consumer_electronics": "Electronics",
  "phones_accessories": "Electronics",
  "computer_office": "Electronics",
  "home_garden": "Home & Garden",
  "home_improvement": "Home & Garden",
  "pet_supplies": "Pet Supplies",
  "womens_clothing": "Fashion",
  "mens_clothing": "Fashion",
  "jewelry_accessories": "Fashion",
  "beauty_health": "Beauty",
  "hair_extensions": "Beauty",
  "sports_entertainment": "Sports & Outdoors",
  "toys_hobbies": "Toys & Games",
  "automobiles_motorcycles": "Automotive",
};

function mapCategory(raw: string): string {
  return CATEGORY_MAP[raw] ?? "Other";
}

// ---------------------------------------------------------------------------
// Raw API response shape (mirrors AliExpress Affiliate API v2)
// ---------------------------------------------------------------------------

interface AliExpressRawProduct {
  product_id: string;
  product_title: string;
  target_sale_price: string;
  target_sale_price_currency: string;
  product_main_image_url: string;
  product_detail_url: string;
  first_level_category_name: string;
  second_level_category_name: string;
  evaluate_rate: string;      // rating as percent string e.g. "96.5"
  orders_count: number;
}

// ---------------------------------------------------------------------------
// API fetcher — swap this for real HTTP call in production
// ---------------------------------------------------------------------------

async function fetchFromAPI(): Promise<AliExpressRawProduct[]> {
  // -----------------------------------------------------------------------
  // TODO(production): Replace this stub with a real API call:
  //
  //   const response = await fetch(
  //     `https://api.aliexpress.com/v2/affiliate/product/query`,
  //     {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //         "x-api-key": process.env.ALIEXPRESS_API_KEY!,
  //       },
  //       body: JSON.stringify({
  //         target_currency: "USD",
  //         target_language: "EN",
  //         sort: "SALE_PRICE_ASC",
  //         page_size: 50,
  //         category_ids: "...",
  //       }),
  //     }
  //   );
  //   const data = await response.json();
  //   return data.resp_result.result.products;
  //
  // -----------------------------------------------------------------------

  // Structured stub: generates deterministic-ish trending products that
  // shift price slightly each run so velocity tracking actually works.
  const now = Date.now();
  const jitter = (base: number) =>
    +(base + (Math.sin(now / 86400000) * base * 0.08)).toFixed(2);

  return [
    {
      product_id: "ae_4001234567890",
      product_title: "Portable Neck Fan 5000mAh USB-C Bladeless",
      target_sale_price: String(jitter(12.99)),
      target_sale_price_currency: "USD",
      product_main_image_url: "https://images.unsplash.com/photo-1591129841117-3adfd313e34f?auto=format&fit=crop&q=80&w=400",
      product_detail_url: "https://www.aliexpress.com/item/4001234567890.html",
      first_level_category_name: "consumer_electronics",
      second_level_category_name: "portable_fans",
      evaluate_rate: "96.5",
      orders_count: 18420,
    },
    {
      product_id: "ae_4001234567891",
      product_title: "360° Self-Cleaning Flat Mop with Bucket",
      target_sale_price: String(jitter(24.50)),
      target_sale_price_currency: "USD",
      product_main_image_url: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=400",
      product_detail_url: "https://www.aliexpress.com/item/4001234567891.html",
      first_level_category_name: "home_garden",
      second_level_category_name: "cleaning_supplies",
      evaluate_rate: "94.2",
      orders_count: 31200,
    },
    {
      product_id: "ae_4001234567892",
      product_title: "Orthopedic Memory Foam Pet Bed Large",
      target_sale_price: String(jitter(19.99)),
      target_sale_price_currency: "USD",
      product_main_image_url: "https://images.unsplash.com/photo-1541599540903-216a46ca1df0?auto=format&fit=crop&q=80&w=400",
      product_detail_url: "https://www.aliexpress.com/item/4001234567892.html",
      first_level_category_name: "pet_supplies",
      second_level_category_name: "pet_beds",
      evaluate_rate: "92.1",
      orders_count: 14300,
    },
    {
      product_id: "ae_4001234567893",
      product_title: "Bluetooth 5.3 Smart Sleep Mask White Noise",
      target_sale_price: String(jitter(18.75)),
      target_sale_price_currency: "USD",
      product_main_image_url: "https://images.unsplash.com/photo-1517639493569-5666a7b2f494?auto=format&fit=crop&q=80&w=400",
      product_detail_url: "https://www.aliexpress.com/item/4001234567893.html",
      first_level_category_name: "consumer_electronics",
      second_level_category_name: "smart_wearables",
      evaluate_rate: "97.8",
      orders_count: 22100,
    },
    {
      product_id: "ae_4001234567894",
      product_title: "Sunset Projection Lamp 16 Colors USB",
      target_sale_price: String(jitter(9.50)),
      target_sale_price_currency: "USD",
      product_main_image_url: "https://images.unsplash.com/photo-1619191163420-4a7c019888a4?auto=format&fit=crop&q=80&w=400",
      product_detail_url: "https://www.aliexpress.com/item/4001234567894.html",
      first_level_category_name: "home_garden",
      second_level_category_name: "novelty_lighting",
      evaluate_rate: "95.3",
      orders_count: 41800,
    },
    {
      product_id: "ae_4001234567895",
      product_title: "Electric Scalp Massager Waterproof IPX7",
      target_sale_price: String(jitter(15.40)),
      target_sale_price_currency: "USD",
      product_main_image_url: "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?auto=format&fit=crop&q=80&w=400",
      product_detail_url: "https://www.aliexpress.com/item/4001234567895.html",
      first_level_category_name: "beauty_health",
      second_level_category_name: "massage",
      evaluate_rate: "93.7",
      orders_count: 27500,
    },
    {
      product_id: "ae_4001234567896",
      product_title: "Mini Projector 1080P WiFi Portable Home Cinema",
      target_sale_price: String(jitter(48.90)),
      target_sale_price_currency: "USD",
      product_main_image_url: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&q=80&w=400",
      product_detail_url: "https://www.aliexpress.com/item/4001234567896.html",
      first_level_category_name: "consumer_electronics",
      second_level_category_name: "projectors",
      evaluate_rate: "91.2",
      orders_count: 9800,
    },
    {
      product_id: "ae_4001234567897",
      product_title: "Resistance Bands Set 5-Level Latex Fitness",
      target_sale_price: String(jitter(6.99)),
      target_sale_price_currency: "USD",
      product_main_image_url: "https://images.unsplash.com/photo-1598289431512-b97b0917affc?auto=format&fit=crop&q=80&w=400",
      product_detail_url: "https://www.aliexpress.com/item/4001234567897.html",
      first_level_category_name: "sports_entertainment",
      second_level_category_name: "fitness_equipment",
      evaluate_rate: "96.1",
      orders_count: 55300,
    },
  ];
}

// ---------------------------------------------------------------------------
// Score heuristic — orders + rating → 0-100 trend score
// ---------------------------------------------------------------------------

function computeScore(orders: number, ratingPct: number): number {
  // Sigmoid-ish curve: diminishing returns past ~30k orders
  const orderSignal = Math.min(100, (orders / 500) ** 0.5 * 10);
  const ratingSignal = ratingPct; // already 0-100
  const raw = orderSignal * 0.6 + ratingSignal * 0.4;
  return Math.round(Math.min(100, Math.max(0, raw)));
}

// ---------------------------------------------------------------------------
// Source adapter
// ---------------------------------------------------------------------------

export const aliExpressSource: ProductSource = {
  name: "aliexpress",

  async fetch(): Promise<CanonicalProduct[]> {
    const raw = await fetchFromAPI();

    return raw.map((p) => ({
      externalId: p.product_id,
      title: p.product_title,
      source: "aliexpress" as const,
      price: parseFloat(p.target_sale_price),
      currency: p.target_sale_price_currency || "USD",
      imageUrl: p.product_main_image_url,
      productUrl: p.product_detail_url,
      category: mapCategory(p.first_level_category_name),
    }));
  },
};

/**
 * Exported for use by the ingestion service to compute an initial
 * trendScore when inserting new trends from this source.
 */
export function scoreAliExpressProduct(raw: AliExpressRawProduct): number {
  return computeScore(raw.orders_count, parseFloat(raw.evaluate_rate));
}
