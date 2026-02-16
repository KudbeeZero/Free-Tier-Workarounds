/**
 * TikTok Shop product source adapter.
 *
 * Production path:
 *   Replace `fetchFromAPI()` with TikTok Shop Affiliate API calls
 *   (or TikTok Creative Center trending products endpoint).
 *
 *   Docs: https://developers.tiktok.com/doc/tiktok-shop-open-api-overview
 *
 * The structured stub below returns realistic viral-product data so the
 * full ingestion pipeline can exercise multi-source dedup and scoring.
 */

import type { CanonicalProduct, ProductSource } from "./normalizeProduct";

// ---------------------------------------------------------------------------
// Raw API response shape (mirrors TikTok Shop API product object)
// ---------------------------------------------------------------------------

interface TikTokRawProduct {
  product_id: string;
  title: string;
  price: { sale_price: number; currency: string };
  main_image: { url: string };
  product_url: string;
  category_name: string;
  sold_count: number;
  rating: number; // 0-5
}

// ---------------------------------------------------------------------------
// Category mapping
// ---------------------------------------------------------------------------

const CATEGORY_MAP: Record<string, string> = {
  "electronics": "Electronics",
  "phone_accessories": "Electronics",
  "home_living": "Home & Garden",
  "kitchen": "Home & Garden",
  "pets": "Pet Supplies",
  "women_fashion": "Fashion",
  "men_fashion": "Fashion",
  "beauty_personal_care": "Beauty",
  "sports_outdoor": "Sports & Outdoors",
  "toys_games": "Toys & Games",
};

function mapCategory(raw: string): string {
  const key = raw.toLowerCase().replace(/[^a-z_]/g, "_");
  return CATEGORY_MAP[key] ?? "Other";
}

// ---------------------------------------------------------------------------
// API fetcher — swap for real HTTP call in production
// ---------------------------------------------------------------------------

async function fetchFromAPI(): Promise<TikTokRawProduct[]> {
  // -----------------------------------------------------------------------
  // TODO(production): Replace with real TikTok Shop API call:
  //
  //   const response = await fetch(
  //     "https://open-api.tiktokglobalshop.com/api/products/search",
  //     {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //         "x-tts-access-token": process.env.TIKTOK_SHOP_TOKEN!,
  //       },
  //       body: JSON.stringify({ page_size: 50, sort_by: "SOLD_COUNT_DESC" }),
  //     }
  //   );
  //   const data = await response.json();
  //   return data.data.products;
  //
  // -----------------------------------------------------------------------

  const now = Date.now();
  const jitter = (base: number) =>
    +(base + (Math.cos(now / 86400000) * base * 0.06)).toFixed(2);

  return [
    {
      product_id: "tt_7891234567001",
      title: "LED Cloud Light DIY Thunderstorm Effect",
      price: { sale_price: jitter(22.99), currency: "USD" },
      main_image: { url: "https://images.unsplash.com/photo-1534088568595-a066f410bcda?auto=format&fit=crop&q=80&w=400" },
      product_url: "https://shop.tiktok.com/view/product/7891234567001",
      category_name: "home_living",
      sold_count: 67200,
      rating: 4.8,
    },
    {
      product_id: "tt_7891234567002",
      title: "Magnetic Phone Charger Stand 360° Rotation",
      price: { sale_price: jitter(14.50), currency: "USD" },
      main_image: { url: "https://images.unsplash.com/photo-1556656793-08538906a9f8?auto=format&fit=crop&q=80&w=400" },
      product_url: "https://shop.tiktok.com/view/product/7891234567002",
      category_name: "electronics",
      sold_count: 89400,
      rating: 4.6,
    },
    {
      product_id: "tt_7891234567003",
      title: "Ice Roller Face Massager Stainless Steel",
      price: { sale_price: jitter(7.99), currency: "USD" },
      main_image: { url: "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?auto=format&fit=crop&q=80&w=400" },
      product_url: "https://shop.tiktok.com/view/product/7891234567003",
      category_name: "beauty_personal_care",
      sold_count: 124000,
      rating: 4.9,
    },
    {
      product_id: "tt_7891234567004",
      title: "Mini Waffle Maker 4-Inch Non-Stick",
      price: { sale_price: jitter(11.25), currency: "USD" },
      main_image: { url: "https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&q=80&w=400" },
      product_url: "https://shop.tiktok.com/view/product/7891234567004",
      category_name: "kitchen",
      sold_count: 53700,
      rating: 4.7,
    },
    {
      product_id: "tt_7891234567005",
      title: "Car Phone Mount Cup Holder Expandable",
      price: { sale_price: jitter(9.99), currency: "USD" },
      main_image: { url: "https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?auto=format&fit=crop&q=80&w=400" },
      product_url: "https://shop.tiktok.com/view/product/7891234567005",
      category_name: "phone_accessories",
      sold_count: 41200,
      rating: 4.5,
    },
  ];
}

// ---------------------------------------------------------------------------
// Source adapter
// ---------------------------------------------------------------------------

export const tiktokSource: ProductSource = {
  name: "tiktok",

  async fetch(): Promise<CanonicalProduct[]> {
    const raw = await fetchFromAPI();

    return raw.map((p) => ({
      externalId: p.product_id,
      title: p.title,
      source: "tiktok" as const,
      price: p.price.sale_price,
      currency: p.price.currency || "USD",
      imageUrl: p.main_image.url,
      productUrl: p.product_url,
      category: mapCategory(p.category_name),
    }));
  },
};
