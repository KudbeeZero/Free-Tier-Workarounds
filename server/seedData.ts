/**
 * Mock product data module for Proof of Trend ($POT)
 *
 * Exports `seedMockData()` — an idempotent function that populates the
 * database with 45 realistic products sourced from AliExpress, TikTok Shop,
 * Temu, and Shopify, complete with 3–6 months of historical price snapshots
 * and blockchain hash anchors.
 *
 * Data is modelled on real trending items from 2025–2026 research across
 * Amazon bestsellers, Walmart trending, Helium 10, TikTok viral,
 * AliExpress top-sellers, Temu bestsellers, and Shopify winning products.
 *
 * Called automatically on server startup (via trendCron) when the trends
 * table is empty.  Can also be invoked manually via `npm run db:seed`.
 */

import { db } from "./db";
import { trends, priceSnapshots, trendHashes } from "@shared/schema";
import { eq, and, count } from "drizzle-orm";
import crypto from "crypto";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fakeHash(seed: string): string {
  return crypto.createHash("sha256").update(seed).digest("hex");
}

function fakeTxId(seed: string): string {
  return crypto
    .createHash("sha256")
    .update(`algo-tx-${seed}`)
    .digest("base64url")
    .slice(0, 52)
    .toUpperCase();
}

function generatePriceHistory(
  basePrice: number,
  pattern: PricePattern,
  numSnapshots: number,
): { price: number; daysAgo: number }[] {
  const snapshots: { price: number; daysAgo: number }[] = [];
  let price = basePrice;

  for (let i = 0; i < numSnapshots; i++) {
    const daysAgo = (numSnapshots - i) * Math.floor(180 / numSnapshots);
    const noise = (Math.random() - 0.5) * basePrice * 0.03;

    switch (pattern) {
      case "rising":
        price = basePrice * (0.82 + (i / numSnapshots) * 0.22) + noise;
        break;
      case "falling":
        price = basePrice * (1.15 - (i / numSnapshots) * 0.20) + noise;
        break;
      case "volatile":
        price = basePrice + Math.sin(i * 1.2) * basePrice * 0.15 + noise;
        break;
      case "steady":
        price = basePrice + noise * 2;
        break;
      case "spike": {
        const mid = numSnapshots * 0.6;
        if (i < mid) {
          price = basePrice * (0.90 + (i / mid) * 0.35) + noise;
        } else {
          price = basePrice * (1.25 - ((i - mid) / (numSnapshots - mid)) * 0.15) + noise;
        }
        break;
      }
      case "dip_recover": {
        const low = numSnapshots * 0.4;
        if (i < low) {
          price = basePrice * (1.0 - (i / low) * 0.25) + noise;
        } else {
          price = basePrice * (0.75 + ((i - low) / (numSnapshots - low)) * 0.30) + noise;
        }
        break;
      }
    }

    snapshots.push({ price: Math.max(0.99, +price.toFixed(2)), daysAgo });
  }

  return snapshots;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type PricePattern = "rising" | "falling" | "volatile" | "steady" | "spike" | "dip_recover";

interface SeedProduct {
  externalId: string;
  name: string;
  category: string;
  description: string;
  sourcePlatform: string;
  productUrl: string;
  imageUrl: string;
  estimatedMargin: string;
  basePrice: number;
  pricePattern: PricePattern;
  snapshotCount: number;
  baseTrendScore: number;
}

// ---------------------------------------------------------------------------
// Product catalogue — 45 products across 4 platforms, all categories
// ---------------------------------------------------------------------------

const products: SeedProduct[] = [
  // =========================================================================
  // ALIEXPRESS (15 products)
  // =========================================================================
  {
    externalId: "ae_500187234001",
    name: "Portable Neck Fan 5000mAh USB-C Bladeless",
    category: "Electronics",
    description: "Trending wearable cooling fan with 5000mAh battery and USB-C fast charging. Ultra-quiet bladeless design with 3 speed settings. Viral on TikTok with 18K+ orders on AliExpress. Source cost $4.20, retail potential $24.99–$34.99.",
    sourcePlatform: "aliexpress",
    productUrl: "https://www.aliexpress.com/item/500187234001.html",
    imageUrl: "https://images.unsplash.com/photo-1591129841117-3adfd313e34f?auto=format&fit=crop&q=80&w=400",
    estimatedMargin: "65–75%",
    basePrice: 12.99,
    pricePattern: "rising",
    snapshotCount: 18,
    baseTrendScore: 78,
  },
  {
    externalId: "ae_500187234002",
    name: "360° Self-Cleaning Flat Mop with Bucket System",
    category: "Home & Garden",
    description: "Hands-free flat mop with self-wringing bucket system. Microfiber pads rotate 360° for deep cleaning. Over 31K orders — a consistent Amazon cross-seller. Source cost $8.50, retail $39.99–$49.99.",
    sourcePlatform: "aliexpress",
    productUrl: "https://www.aliexpress.com/item/500187234002.html",
    imageUrl: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=400",
    estimatedMargin: "60–70%",
    basePrice: 24.50,
    pricePattern: "steady",
    snapshotCount: 20,
    baseTrendScore: 72,
  },
  {
    externalId: "ae_500187234003",
    name: "Orthopedic Memory Foam Pet Bed L/XL",
    category: "Pet Supplies",
    description: "Premium orthopedic memory foam pet bed with removable washable cover. Waterproof liner and non-slip bottom. The $230B pet care market drives consistent demand. Source cost $7.50, retail $34.99–$44.99.",
    sourcePlatform: "aliexpress",
    productUrl: "https://www.aliexpress.com/item/500187234003.html",
    imageUrl: "https://images.unsplash.com/photo-1541599540903-216a46ca1df0?auto=format&fit=crop&q=80&w=400",
    estimatedMargin: "55–65%",
    basePrice: 19.99,
    pricePattern: "dip_recover",
    snapshotCount: 16,
    baseTrendScore: 68,
  },
  {
    externalId: "ae_500187234004",
    name: "Bluetooth 5.3 Smart Sleep Mask with White Noise",
    category: "Electronics",
    description: "3D contoured sleep mask with built-in Bluetooth 5.3 speakers and white noise generator. Ultra-soft memory foam, 10hr battery. Wellness-tech crossover trending across platforms. Source $6.80, retail $29.99–$39.99.",
    sourcePlatform: "aliexpress",
    productUrl: "https://www.aliexpress.com/item/500187234004.html",
    imageUrl: "https://images.unsplash.com/photo-1517639493569-5666a7b2f494?auto=format&fit=crop&q=80&w=400",
    estimatedMargin: "70–80%",
    basePrice: 18.75,
    pricePattern: "rising",
    snapshotCount: 22,
    baseTrendScore: 85,
  },
  {
    externalId: "ae_500187234005",
    name: "Sunset Projection Lamp 16 Colors USB Powered",
    category: "Home & Garden",
    description: "Viral aesthetic sunset lamp with 16 color modes and 360° rotation. USB powered with remote control. #SunsetLamp has 2.1B TikTok views. Source cost $3.20, retail $19.99–$29.99.",
    sourcePlatform: "aliexpress",
    productUrl: "https://www.aliexpress.com/item/500187234005.html",
    imageUrl: "https://images.unsplash.com/photo-1619191163420-4a7c019888a4?auto=format&fit=crop&q=80&w=400",
    estimatedMargin: "75–85%",
    basePrice: 9.50,
    pricePattern: "volatile",
    snapshotCount: 24,
    baseTrendScore: 88,
  },
  {
    externalId: "ae_500187234006",
    name: "Electric Scalp Massager Waterproof IPX7 4-Head",
    category: "Beauty",
    description: "Rechargeable electric scalp massager with 4 rotating heads and IPX7 waterproof rating. Promotes relaxation and hair growth stimulation. Strong Amazon crossover — 27K+ AliExpress orders. Source $5.40, retail $24.99–$34.99.",
    sourcePlatform: "aliexpress",
    productUrl: "https://www.aliexpress.com/item/500187234006.html",
    imageUrl: "https://images.unsplash.com/photo-1596755389378-c31d21fd1273?auto=format&fit=crop&q=80&w=400",
    estimatedMargin: "65–75%",
    basePrice: 15.40,
    pricePattern: "rising",
    snapshotCount: 19,
    baseTrendScore: 74,
  },
  {
    externalId: "ae_500187234007",
    name: "Mini Projector 1080P WiFi 6 Portable Home Cinema",
    category: "Electronics",
    description: "Compact 1080P native projector with WiFi 6 and Bluetooth 5.2. 200-inch projection, built-in speaker, HDMI/USB ports. Mini projectors are a consistent Helium 10 top-mover. Source $18.90, retail $79.99–$129.99.",
    sourcePlatform: "aliexpress",
    productUrl: "https://www.aliexpress.com/item/500187234007.html",
    imageUrl: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?auto=format&fit=crop&q=80&w=400",
    estimatedMargin: "55–65%",
    basePrice: 48.90,
    pricePattern: "falling",
    snapshotCount: 20,
    baseTrendScore: 71,
  },
  {
    externalId: "ae_500187234008",
    name: "Resistance Bands Set 5-Level Natural Latex Fitness",
    category: "Sports & Outdoors",
    description: "5-piece color-coded resistance band set with carry bag. Natural latex, non-slip design. Fitness accessories remain a top Amazon category with $10B+ annual sales. Source $1.80, retail $14.99–$19.99.",
    sourcePlatform: "aliexpress",
    productUrl: "https://www.aliexpress.com/item/500187234008.html",
    imageUrl: "https://images.unsplash.com/photo-1598289431512-b97b0917affc?auto=format&fit=crop&q=80&w=400",
    estimatedMargin: "75–85%",
    basePrice: 6.99,
    pricePattern: "steady",
    snapshotCount: 22,
    baseTrendScore: 82,
  },
  {
    externalId: "ae_500187234009",
    name: "Rain Cloud Aroma Diffuser with 7 LED Colors",
    category: "Home & Garden",
    description: "Viral rain cloud humidifier with aromatherapy essential oil diffuser and 7 color night light. Mesmerizing water-drop effect is TikTok gold. Source $4.50, retail $39.99–$59.99.",
    sourcePlatform: "aliexpress",
    productUrl: "https://www.aliexpress.com/item/500187234009.html",
    imageUrl: "https://images.unsplash.com/photo-1534088568595-a066f410bcda?auto=format&fit=crop&q=80&w=400",
    estimatedMargin: "70–80%",
    basePrice: 14.50,
    pricePattern: "spike",
    snapshotCount: 20,
    baseTrendScore: 91,
  },
  {
    externalId: "ae_500187234010",
    name: "Cordless Handheld Vacuum 12KPa Strong Suction",
    category: "Home & Garden",
    description: "Lightweight cordless handheld vacuum with 12KPa suction, HEPA filter, and USB-C charging. Perfect for cars, desks, and quick clean-ups. Cordless vacuums are #1 trending on AliExpress 2026. Source $11.99, retail $39.99–$54.99.",
    sourcePlatform: "aliexpress",
    productUrl: "https://www.aliexpress.com/item/500187234010.html",
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?auto=format&fit=crop&q=80&w=400",
    estimatedMargin: "55–65%",
    basePrice: 32.99,
    pricePattern: "falling",
    snapshotCount: 18,
    baseTrendScore: 76,
  },
  {
    externalId: "ae_500187234011",
    name: "Smart LED Strip Lights 10M RGB WiFi App Control",
    category: "Electronics",
    description: "10-meter RGB LED strip with WiFi control, Alexa/Google compatible. Music sync mode, 16M colors, timer scheduling. Smart LED strips are a Gen Z bedroom staple. Source $3.20, retail $19.99–$24.99.",
    sourcePlatform: "aliexpress",
    productUrl: "https://www.aliexpress.com/item/500187234011.html",
    imageUrl: "https://images.unsplash.com/photo-1615866431971-9c2f39d43aea?auto=format&fit=crop&q=80&w=400",
    estimatedMargin: "75–85%",
    basePrice: 8.99,
    pricePattern: "steady",
    snapshotCount: 24,
    baseTrendScore: 80,
  },
  {
    externalId: "ae_500187234012",
    name: "MagSafe Compatible Magnetic Phone Ring Holder Stand",
    category: "Electronics",
    description: "Ultra-thin magnetic phone ring holder compatible with MagSafe. 360° rotation, foldable kickstand. Phone accessories drive massive volume on AliExpress with 200M+ annual unit sales. Source $1.20, retail $9.99–$14.99.",
    sourcePlatform: "aliexpress",
    productUrl: "https://www.aliexpress.com/item/500187234012.html",
    imageUrl: "https://images.unsplash.com/photo-1556656793-08538906a9f8?auto=format&fit=crop&q=80&w=400",
    estimatedMargin: "80–90%",
    basePrice: 4.99,
    pricePattern: "volatile",
    snapshotCount: 22,
    baseTrendScore: 69,
  },
  {
    externalId: "ae_500187234013",
    name: "Silicone Kitchen Utensil Set 12-Piece Heat Resistant",
    category: "Home & Garden",
    description: "BPA-free silicone cooking utensil set with wooden handles. Heat resistant to 480°F, dishwasher safe. Kitchen sets consistently rank in Amazon's top 100. Source $4.50, retail $24.99–$34.99.",
    sourcePlatform: "aliexpress",
    productUrl: "https://www.aliexpress.com/item/500187234013.html",
    imageUrl: "https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?auto=format&fit=crop&q=80&w=400",
    estimatedMargin: "65–75%",
    basePrice: 11.99,
    pricePattern: "steady",
    snapshotCount: 16,
    baseTrendScore: 64,
  },
  {
    externalId: "ae_500187234014",
    name: "Anti-Snoring Mouth Guard Adjustable BPA-Free",
    category: "Health",
    description: "Moldable anti-snoring mouthpiece with adjustable fit. BPA-free medical-grade silicone. Sleep health products see 200% search increase on Amazon Q1 2026. Source $2.80, retail $29.99–$39.99.",
    sourcePlatform: "aliexpress",
    productUrl: "https://www.aliexpress.com/item/500187234014.html",
    imageUrl: "https://images.unsplash.com/photo-1631157769867-cc4dbe0834bf?auto=format&fit=crop&q=80&w=400",
    estimatedMargin: "75–85%",
    basePrice: 8.50,
    pricePattern: "rising",
    snapshotCount: 18,
    baseTrendScore: 73,
  },
  {
    externalId: "ae_500187234015",
    name: "Foldable Walking Pad Under-Desk Treadmill 2.5HP",
    category: "Sports & Outdoors",
    description: "Ultra-slim foldable walking pad with 2.5HP motor, LED display, and remote control. Under-desk design for WFH. Walking pads are the #1 AliExpress fitness product at $300 avg. Source $89, retail $199–$279.",
    sourcePlatform: "aliexpress",
    productUrl: "https://www.aliexpress.com/item/500187234015.html",
    imageUrl: "https://images.unsplash.com/photo-1576678927484-cc907957088c?auto=format&fit=crop&q=80&w=400",
    estimatedMargin: "40–55%",
    basePrice: 159.99,
    pricePattern: "dip_recover",
    snapshotCount: 20,
    baseTrendScore: 83,
  },

  // =========================================================================
  // TIKTOK SHOP (12 products)
  // =========================================================================
  {
    externalId: "tt_789456123001",
    name: "LED Cloud Light DIY Thunderstorm Effect",
    category: "Home & Garden",
    description: "Viral TikTok cloud lamp with realistic thunder and lightning effects. DIY cotton cloud design with LED RGB strip. #CloudLamp has 890M views. Over 67K units sold on TikTok Shop. Source $8.50, retail $39.99–$59.99.",
    sourcePlatform: "tiktok",
    productUrl: "https://shop.tiktok.com/view/product/789456123001",
    imageUrl: "https://images.unsplash.com/photo-1534088568595-a066f410bcda?auto=format&fit=crop&q=80&w=400",
    estimatedMargin: "65–75%",
    basePrice: 22.99,
    pricePattern: "spike",
    snapshotCount: 22,
    baseTrendScore: 92,
  },
  {
    externalId: "tt_789456123002",
    name: "Magnetic Phone Charger Stand 360° MagSafe",
    category: "Electronics",
    description: "3-in-1 magnetic wireless charging stand for iPhone, AirPods, and Apple Watch. 360° rotation, 15W fast charge. 89K+ sold on TikTok Shop. Tech accessories dominate TikTok sales. Source $5.20, retail $24.99–$34.99.",
    sourcePlatform: "tiktok",
    productUrl: "https://shop.tiktok.com/view/product/789456123002",
    imageUrl: "https://images.unsplash.com/photo-1586953208270-767889fa9b0e?auto=format&fit=crop&q=80&w=400",
    estimatedMargin: "60–70%",
    basePrice: 14.50,
    pricePattern: "rising",
    snapshotCount: 20,
    baseTrendScore: 79,
  },
  {
    externalId: "tt_789456123003",
    name: "Ice Roller Face Massager Stainless Steel",
    category: "Beauty",
    description: "Stainless steel ice roller for face and eye depuffing. No batteries needed — just freeze and roll. 124K sold on TikTok Shop, #IceRoller has 1.3B views. Source $1.50, retail $12.99–$19.99.",
    sourcePlatform: "tiktok",
    productUrl: "https://shop.tiktok.com/view/product/789456123003",
    imageUrl: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&q=80&w=400",
    estimatedMargin: "80–90%",
    basePrice: 7.99,
    pricePattern: "rising",
    snapshotCount: 24,
    baseTrendScore: 94,
  },
  {
    externalId: "tt_789456123004",
    name: "Mini Waffle Maker 4-Inch Non-Stick Compact",
    category: "Home & Garden",
    description: "Compact 4-inch waffle maker with non-stick plates and indicator light. Makes waffles, hash browns, paninis. Kitchen gadgets are a perennial TikTok viral category. Source $4.50, retail $19.99–$24.99.",
    sourcePlatform: "tiktok",
    productUrl: "https://shop.tiktok.com/view/product/789456123004",
    imageUrl: "https://images.unsplash.com/photo-1562376552-0d160a2f238d?auto=format&fit=crop&q=80&w=400",
    estimatedMargin: "60–70%",
    basePrice: 11.25,
    pricePattern: "steady",
    snapshotCount: 18,
    baseTrendScore: 70,
  },
  {
    externalId: "tt_789456123005",
    name: "Peel-Off Lip Tint Long Lasting 12hr Color",
    category: "Beauty",
    description: "Viral peel-off lip tint with 12-hour color hold. Apply, wait, peel for perfect matte lips. #LipTint exploded in 2025 with $5 lip oils outselling $30 brands. Source $0.80, retail $9.99–$14.99.",
    sourcePlatform: "tiktok",
    productUrl: "https://shop.tiktok.com/view/product/789456123005",
    imageUrl: "https://images.unsplash.com/photo-1586495777744-4413f21062fa?auto=format&fit=crop&q=80&w=400",
    estimatedMargin: "85–92%",
    basePrice: 5.99,
    pricePattern: "spike",
    snapshotCount: 22,
    baseTrendScore: 96,
  },
  {
    externalId: "tt_789456123006",
    name: "Galaxy Star Projector with Bluetooth Speaker",
    category: "Electronics",
    description: "LED galaxy projector with built-in Bluetooth speaker and timer. Projects nebula, stars, and aurora effects. A single viral TikTok clip drove 10K+ orders in 2 weeks. Source $5.50, retail $29.99–$39.99.",
    sourcePlatform: "tiktok",
    productUrl: "https://shop.tiktok.com/view/product/789456123006",
    imageUrl: "https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?auto=format&fit=crop&q=80&w=400",
    estimatedMargin: "65–80%",
    basePrice: 15.99,
    pricePattern: "volatile",
    snapshotCount: 20,
    baseTrendScore: 87,
  },
  {
    externalId: "tt_789456123007",
    name: "Press-On Nail Kit Salon Quality 240-Piece",
    category: "Beauty",
    description: "Professional press-on nail kit with 240 nails in 12 sizes, glue, and file. Salon results at home — a direct competitor to $50+ salon visits. Press-on nails are a top TikTok Shop beauty category. Source $2.80, retail $14.99–$24.99.",
    sourcePlatform: "tiktok",
    productUrl: "https://shop.tiktok.com/view/product/789456123007",
    imageUrl: "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&q=80&w=400",
    estimatedMargin: "75–85%",
    basePrice: 12.99,
    pricePattern: "rising",
    snapshotCount: 18,
    baseTrendScore: 81,
  },
  {
    externalId: "tt_789456123008",
    name: "Wax Melting Lamp Candle Warmer Aromatherapy",
    category: "Home & Garden",
    description: "Elegant candle wax melting lamp — no flame, no soot. Warms scented candles from above with a halogen bulb. Viral TikTok sensation redefining aromatherapy at home. Source $7.20, retail $34.99–$49.99.",
    sourcePlatform: "tiktok",
    productUrl: "https://shop.tiktok.com/view/product/789456123008",
    imageUrl: "https://images.unsplash.com/photo-1602607742069-14a489ab840a?auto=format&fit=crop&q=80&w=400",
    estimatedMargin: "65–75%",
    basePrice: 19.99,
    pricePattern: "rising",
    snapshotCount: 20,
    baseTrendScore: 84,
  },
  {
    externalId: "tt_789456123009",
    name: "Personal Safety Alarm Keychain 130dB LED",
    category: "Health",
    description: "130dB personal safety alarm with LED flashlight and carabiner clip. Compact, lightweight, and waterproof. Self-defense products trend on TikTok with 450M+ views. Source $1.20, retail $9.99–$14.99.",
    sourcePlatform: "tiktok",
    productUrl: "https://shop.tiktok.com/view/product/789456123009",
    imageUrl: "https://images.unsplash.com/photo-1585771724684-38269d6639fd?auto=format&fit=crop&q=80&w=400",
    estimatedMargin: "80–90%",
    basePrice: 4.99,
    pricePattern: "steady",
    snapshotCount: 16,
    baseTrendScore: 67,
  },
  {
    externalId: "tt_789456123010",
    name: "Oversized Wearable Blanket Hoodie Sherpa",
    category: "Fashion",
    description: "Giant oversized blanket hoodie with sherpa fleece lining, front pocket, and hood. One-size-fits-all cozy wear. Oversized hoodies are a reliable TikTok bestseller year-round. Source $9.50, retail $34.99–$49.99.",
    sourcePlatform: "tiktok",
    productUrl: "https://shop.tiktok.com/view/product/789456123010",
    imageUrl: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=400",
    estimatedMargin: "55–65%",
    basePrice: 24.99,
    pricePattern: "volatile",
    snapshotCount: 22,
    baseTrendScore: 75,
  },
  {
    externalId: "tt_789456123011",
    name: "Deep Tissue Head & Scalp Massager Electric",
    category: "Health",
    description: "Electric deep tissue head massager with 12 vibrating nodes and red light therapy. Rechargeable, 3 intensity levels. Home fitness/wellness products are in high demand 2026 — retail $120–$150 vs source $35–$45.",
    sourcePlatform: "tiktok",
    productUrl: "https://shop.tiktok.com/view/product/789456123011",
    imageUrl: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&q=80&w=400",
    estimatedMargin: "65–75%",
    basePrice: 35.99,
    pricePattern: "rising",
    snapshotCount: 18,
    baseTrendScore: 77,
  },
  {
    externalId: "tt_789456123012",
    name: "Car Phone Mount Cup Holder Expandable Base",
    category: "Automotive",
    description: "Universal car phone mount that fits in any cup holder with expandable base. Adjustable arm, 360° rotation, one-hand operation. 41K+ sold on TikTok Shop. Source $3.50, retail $14.99–$19.99.",
    sourcePlatform: "tiktok",
    productUrl: "https://shop.tiktok.com/view/product/789456123012",
    imageUrl: "https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?auto=format&fit=crop&q=80&w=400",
    estimatedMargin: "70–80%",
    basePrice: 9.99,
    pricePattern: "steady",
    snapshotCount: 16,
    baseTrendScore: 66,
  },

  // =========================================================================
  // TEMU (10 products)
  // =========================================================================
  {
    externalId: "tm_901234567001",
    name: "Mini Desktop Vacuum Cleaner USB Rechargeable",
    category: "Electronics",
    description: "Compact desktop vacuum for keyboards, desks, and car interiors. USB rechargeable with strong suction. Under $4 on Temu, resells $14–$18. #StudyTok and #WorkFromHome trending category.",
    sourcePlatform: "temu",
    productUrl: "https://www.temu.com/product/901234567001.html",
    imageUrl: "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&q=80&w=400",
    estimatedMargin: "75–85%",
    basePrice: 3.99,
    pricePattern: "falling",
    snapshotCount: 20,
    baseTrendScore: 71,
  },
  {
    externalId: "tm_901234567002",
    name: "Portable Dog Paw Cleaner Soft Silicone",
    category: "Pet Supplies",
    description: "One-press paw cleaner with soft silicone bristles for gentle deep cleaning. BPA-free, dishwasher safe. Pet paw cleaners are Temu top performers with 250%+ profit margins. Source $2.10, retail $14.99.",
    sourcePlatform: "temu",
    productUrl: "https://www.temu.com/product/901234567002.html",
    imageUrl: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?auto=format&fit=crop&q=80&w=400",
    estimatedMargin: "70–80%",
    basePrice: 6.50,
    pricePattern: "steady",
    snapshotCount: 18,
    baseTrendScore: 65,
  },
  {
    externalId: "tm_901234567003",
    name: "Double-Sided Magnetic Window Cleaner",
    category: "Home & Garden",
    description: "Magnetic window cleaner for single/double-glazed windows up to 25mm thick. Clean both sides simultaneously. Viral on TikTok with #CleanTok driving 68% of Temu trending products. Source $4.50, retail $24.99.",
    sourcePlatform: "temu",
    productUrl: "https://www.temu.com/product/901234567003.html",
    imageUrl: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&q=80&w=400",
    estimatedMargin: "65–75%",
    basePrice: 12.99,
    pricePattern: "rising",
    snapshotCount: 20,
    baseTrendScore: 73,
  },
  {
    externalId: "tm_901234567004",
    name: "Quick Release Adjustable Belt No-Hole Design",
    category: "Fashion",
    description: "Ratchet belt with automatic buckle and no-hole micro-adjustment. Google Trends shows 'adjustable belt' consistently outranking other belt terms since 2024. Source $3.80, retail $19.99–$29.99.",
    sourcePlatform: "temu",
    productUrl: "https://www.temu.com/product/901234567004.html",
    imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=400",
    estimatedMargin: "70–80%",
    basePrice: 8.99,
    pricePattern: "steady",
    snapshotCount: 16,
    baseTrendScore: 62,
  },
  {
    externalId: "tm_901234567005",
    name: "TWS Bluetooth Earbuds LED Power Display",
    category: "Electronics",
    description: "True wireless earbuds with LED battery display, 30hr total playtime, and IPX5 waterproof. Bluetooth 5.3 with low-latency gaming mode. Temu earbuds at $9.99 compete with $39.99 branded alternatives.",
    sourcePlatform: "temu",
    productUrl: "https://www.temu.com/product/901234567005.html",
    imageUrl: "https://images.unsplash.com/photo-1590658268037-6bf12f032f55?auto=format&fit=crop&q=80&w=400",
    estimatedMargin: "60–70%",
    basePrice: 9.99,
    pricePattern: "falling",
    snapshotCount: 22,
    baseTrendScore: 74,
  },
  {
    externalId: "tm_901234567006",
    name: "Power Bank 20000mAh USB-C PD Fast Charge",
    category: "Electronics",
    description: "High-capacity 20000mAh power bank with USB-C PD 20W fast charging and built-in cable. LED indicator, compact design. Portable chargers are consistently hot on Temu. Source $5.99, retail $24.99.",
    sourcePlatform: "temu",
    productUrl: "https://www.temu.com/product/901234567006.html",
    imageUrl: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?auto=format&fit=crop&q=80&w=400",
    estimatedMargin: "55–65%",
    basePrice: 14.99,
    pricePattern: "dip_recover",
    snapshotCount: 20,
    baseTrendScore: 70,
  },
  {
    externalId: "tm_901234567007",
    name: "Automatic Cat Laser Toy Interactive 5 Patterns",
    category: "Pet Supplies",
    description: "Auto-rotating cat laser toy with 5 random patterns and adjustable speed. USB rechargeable with timer. Pet tech is booming — the global pet care industry is $230B+. Source $2.80, retail $14.99–$19.99.",
    sourcePlatform: "temu",
    productUrl: "https://www.temu.com/product/901234567007.html",
    imageUrl: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&q=80&w=400",
    estimatedMargin: "65–80%",
    basePrice: 7.99,
    pricePattern: "volatile",
    snapshotCount: 18,
    baseTrendScore: 68,
  },
  {
    externalId: "tm_901234567008",
    name: "Silicone Spatula Baking Set 5-Piece Heat Resistant",
    category: "Home & Garden",
    description: "5-piece silicone spatula set with wooden handles. Heat resistant to 450°F, non-stick, dishwasher safe. Kitchen gadgets represent 29% of Temu's top sellers. Source $1.10, retail $9.99–$14.99.",
    sourcePlatform: "temu",
    productUrl: "https://www.temu.com/product/901234567008.html",
    imageUrl: "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&q=80&w=400",
    estimatedMargin: "70–85%",
    basePrice: 3.49,
    pricePattern: "steady",
    snapshotCount: 14,
    baseTrendScore: 58,
  },
  {
    externalId: "tm_901234567009",
    name: "Kids U-Shape Electric Toothbrush Sonic",
    category: "Health",
    description: "U-shaped sonic electric toothbrush designed for kids 2–12. 360° cleaning with soft food-grade silicone. Kids toothbrushes sell $29.99–$39.99 at retail vs $6–$8 source — 70%+ margin.",
    sourcePlatform: "temu",
    productUrl: "https://www.temu.com/product/901234567009.html",
    imageUrl: "https://images.unsplash.com/photo-1559526323-cb2f2fe2591b?auto=format&fit=crop&q=80&w=400",
    estimatedMargin: "70–80%",
    basePrice: 6.99,
    pricePattern: "rising",
    snapshotCount: 16,
    baseTrendScore: 66,
  },
  {
    externalId: "tm_901234567010",
    name: "Acrylic Nail Kit Full Set UV Gel Polish 48-Color",
    category: "Beauty",
    description: "Complete acrylic nail kit with 48 UV gel colors, LED lamp, tools, and tips. DIY salon-quality nails at home. Acrylic nail kits are perfect for repeat sales — customers always need more colors. Source $4.50, retail $24.99.",
    sourcePlatform: "temu",
    productUrl: "https://www.temu.com/product/901234567010.html",
    imageUrl: "https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&q=80&w=400",
    estimatedMargin: "65–75%",
    basePrice: 11.99,
    pricePattern: "spike",
    snapshotCount: 20,
    baseTrendScore: 76,
  },

  // =========================================================================
  // SHOPIFY (8 products — higher AOV, branded positioning)
  // =========================================================================
  {
    externalId: "sh_601234567001",
    name: "Healing Tuning Fork Set 528Hz Weighted 5-Piece",
    category: "Health",
    description: "Professional weighted tuning fork set at 528Hz 'love frequency' plus 4 harmonic frequencies. Includes mallet and carry case. Healing tuning forks have 85–90% margins — source $5–$8, retail $55. Wellness trending on Shopify.",
    sourcePlatform: "shopify",
    productUrl: "https://example-store.myshopify.com/products/tuning-fork-set",
    imageUrl: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&q=80&w=400",
    estimatedMargin: "85–90%",
    basePrice: 29.99,
    pricePattern: "rising",
    snapshotCount: 18,
    baseTrendScore: 72,
  },
  {
    externalId: "sh_601234567002",
    name: "Electric Rotary Tool Kit 150-Piece Variable Speed",
    category: "Electronics",
    description: "Variable speed rotary tool with 150 accessories for cutting, grinding, polishing, and engraving. Comparable to Dremel at 1/3 the price. Electric rotary kits have 60–75% margins on Shopify. Source $10–$20, retail $45–$65.",
    sourcePlatform: "shopify",
    productUrl: "https://example-store.myshopify.com/products/rotary-tool-kit",
    imageUrl: "https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&q=80&w=400",
    estimatedMargin: "60–75%",
    basePrice: 39.99,
    pricePattern: "steady",
    snapshotCount: 16,
    baseTrendScore: 63,
  },
  {
    externalId: "sh_601234567003",
    name: "AI Voice Translator Pen 112 Languages Instant",
    category: "Electronics",
    description: "AI-powered translation pen that scans and translates text in 112 languages in real-time. Offline mode for 8 languages. Innovative tech products thrive on Shopify — source $28.84, retail $64+.",
    sourcePlatform: "shopify",
    productUrl: "https://example-store.myshopify.com/products/ai-translator-pen",
    imageUrl: "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&q=80&w=400",
    estimatedMargin: "55–65%",
    basePrice: 45.99,
    pricePattern: "rising",
    snapshotCount: 14,
    baseTrendScore: 69,
  },
  {
    externalId: "sh_601234567004",
    name: "Anti-Theft USB Charging Backpack Water Resistant",
    category: "Fashion",
    description: "Laptop backpack with hidden anti-theft pocket, built-in USB charging port, and water-resistant fabric. Fits 15.6\" laptops. Anti-theft bags are Shopify bestsellers — source $7–$12, retail $49.99–$59.99.",
    sourcePlatform: "shopify",
    productUrl: "https://example-store.myshopify.com/products/anti-theft-backpack",
    imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=400",
    estimatedMargin: "65–75%",
    basePrice: 34.99,
    pricePattern: "dip_recover",
    snapshotCount: 18,
    baseTrendScore: 67,
  },
  {
    externalId: "sh_601234567005",
    name: "Smart Posture Corrector Vibration Reminder",
    category: "Health",
    description: "Intelligent posture corrector with vibration alerts when slouching detected. Lightweight, invisible under clothing. Posture correctors are a pain-point product with strong impulse-buy potential. Source $8.50, retail $29.99–$39.99.",
    sourcePlatform: "shopify",
    productUrl: "https://example-store.myshopify.com/products/smart-posture-corrector",
    imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&q=80&w=400",
    estimatedMargin: "65–75%",
    basePrice: 24.99,
    pricePattern: "rising",
    snapshotCount: 20,
    baseTrendScore: 75,
  },
  {
    externalId: "sh_601234567006",
    name: "Levitating Moon Lamp Magnetic Float 3D Print",
    category: "Home & Garden",
    description: "3D-printed moon lamp that magnetically levitates and rotates. Touch-sensitive brightness control, 3 color modes. The 'wow factor' product — high perceived value, strong gift-market appeal. Source $15, retail $59.99–$79.99.",
    sourcePlatform: "shopify",
    productUrl: "https://example-store.myshopify.com/products/levitating-moon-lamp",
    imageUrl: "https://images.unsplash.com/photo-1532693322450-2cb5c511067d?auto=format&fit=crop&q=80&w=400",
    estimatedMargin: "60–75%",
    basePrice: 42.99,
    pricePattern: "volatile",
    snapshotCount: 22,
    baseTrendScore: 80,
  },
  {
    externalId: "sh_601234567007",
    name: "Peeling Exfoliating Serum AHA+BHA Glass Skin",
    category: "Beauty",
    description: "AHA+BHA peeling solution for glass skin effect. Viral 'clean girl' beauty trend on Instagram and TikTok. One of the highest-margin products in dropshipping — source $4–$5, retail $20–$30, 81–85% gross profit.",
    sourcePlatform: "shopify",
    productUrl: "https://example-store.myshopify.com/products/peeling-serum",
    imageUrl: "https://images.unsplash.com/photo-1556228578-0d85b1a4d571?auto=format&fit=crop&q=80&w=400",
    estimatedMargin: "81–85%",
    basePrice: 18.99,
    pricePattern: "spike",
    snapshotCount: 24,
    baseTrendScore: 89,
  },
  {
    externalId: "sh_601234567008",
    name: "Smart Door Lock WiFi Keyless Entry Fingerprint",
    category: "Electronics",
    description: "WiFi-enabled smart door lock with fingerprint, code, key card, and app unlock. Auto-lock, visitor logs, Alexa compatible. Smart home products are trending with smart home enthusiasts on Shopify. Source $22, retail $79.99–$99.99.",
    sourcePlatform: "shopify",
    productUrl: "https://example-store.myshopify.com/products/smart-door-lock",
    imageUrl: "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&q=80&w=400",
    estimatedMargin: "55–70%",
    basePrice: 59.99,
    pricePattern: "falling",
    snapshotCount: 18,
    baseTrendScore: 71,
  },
];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Seed mock product data into the database.
 *
 * Idempotent — skips products whose externalId + sourcePlatform already exist.
 * Returns `true` if any new products were created, `false` if everything was
 * already present.
 */
export async function seedMockData(): Promise<boolean> {
  // Quick check: if the table already has a meaningful number of rows, skip
  const [row] = await db.select({ value: count() }).from(trends);
  const existing = row?.value ?? 0;

  if (existing >= products.length) {
    console.log(`[seed] Database already has ${existing} trends — skipping seed`);
    return false;
  }

  console.log(`[seed] Database has ${existing} trends — seeding ${products.length} products...`);

  let created = 0;
  let skipped = 0;

  for (const p of products) {
    const [exists] = await db
      .select()
      .from(trends)
      .where(and(eq(trends.externalId, p.externalId), eq(trends.sourcePlatform, p.sourcePlatform)));

    if (exists) {
      skipped++;
      continue;
    }

    // Insert trend
    const [trend] = await db
      .insert(trends)
      .values({
        name: p.name,
        category: p.category,
        description: p.description,
        trendScore: p.baseTrendScore,
        productUrl: p.productUrl,
        imageUrl: p.imageUrl,
        estimatedMargin: p.estimatedMargin,
        sourcePlatform: p.sourcePlatform,
        externalId: p.externalId,
        priceVelocity: null,
        detectedAt: new Date(Date.now() - Math.random() * 120 * 24 * 60 * 60 * 1000),
      })
      .returning();

    // Generate price history
    const history = generatePriceHistory(p.basePrice, p.pricePattern, p.snapshotCount);
    for (const snap of history) {
      const recordedAt = new Date(Date.now() - snap.daysAgo * 24 * 60 * 60 * 1000);
      await db.insert(priceSnapshots).values({
        trendId: trend.id,
        source: p.sourcePlatform,
        price: snap.price.toFixed(2),
        recordedAt,
      });
    }

    // Compute velocity from last two snapshots
    if (history.length >= 2) {
      const last = history[history.length - 1].price;
      const prev = history[history.length - 2].price;
      const velocity = prev !== 0 ? (((last - prev) / prev) * 100).toFixed(2) : "0.00";
      await db
        .update(trends)
        .set({ priceVelocity: velocity })
        .where(eq(trends.id, trend.id));
    }

    // Generate blockchain hash anchors (2–5 per product)
    const hashCount = 2 + Math.floor(Math.random() * 4);
    for (let h = 0; h < hashCount; h++) {
      const hashSeed = `${p.externalId}-anchor-${h}-${Date.now()}`;
      const anchorDate = new Date(
        Date.now() - (hashCount - h) * (Math.random() * 20 + 5) * 24 * 60 * 60 * 1000,
      );
      await db.insert(trendHashes).values({
        trendId: trend.id,
        hash: fakeHash(hashSeed),
        blockchainTxId: fakeTxId(hashSeed),
        timestamp: anchorDate,
      });
    }

    created++;
    console.log(
      `  [seed] "${p.name}" (${p.sourcePlatform}) — id=${trend.id}, ${history.length} snapshots, ${hashCount} anchors`,
    );
  }

  console.log(`[seed] Complete: ${created} created, ${skipped} skipped`);
  return created > 0;
}
