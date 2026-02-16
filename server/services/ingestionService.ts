/**
 * Ingestion Engine
 *
 * Orchestrates the full pipeline:
 *   1. Collect products from all registered sources
 *   2. Normalize each into canonical format
 *   3. Upsert into `trends` (dedup by externalId + source)
 *   4. Append a `priceSnapshots` row for every product
 *   5. Compute price velocity from last two snapshots
 *   6. Emit an event when a brand-new trend is discovered
 *
 * Designed for scale: processes products in configurable-size batches
 * with per-item error isolation so one bad record never kills a run.
 */

import { storage } from "../storage";
import { EventEmitter } from "events";
import type { Trend } from "@shared/schema";
import { calculateTrendScore } from "../private/trendScoring";
import {
  type CanonicalProduct,
  type ProductSource,
  normalizeProduct,
} from "./sources/normalizeProduct";
import { aliExpressSource } from "./sources/aliExpressSource";
import { tiktokSource } from "./sources/tiktokSource";

// ---------------------------------------------------------------------------
// Event bus — other modules (blockchain stamper, notifications) can subscribe
// ---------------------------------------------------------------------------

export const ingestionEvents = new EventEmitter();

/**
 * Fired the first time a product is inserted into `trends`.
 * Payload: the newly created Trend row.
 */
export const EVENT_NEW_TREND = "trend:discovered";

// ---------------------------------------------------------------------------
// Source registry — add new adapters here
// ---------------------------------------------------------------------------

const sources: ProductSource[] = [
  aliExpressSource,
  tiktokSource,
  // Add new sources here:
  // temuSource,
  // shopifySource,
];

/**
 * Register a source at runtime (useful for testing or plugin-style loading).
 */
export function registerSource(source: ProductSource): void {
  sources.push(source);
}

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const BATCH_SIZE = 50; // Products processed per DB transaction batch

// ---------------------------------------------------------------------------
// Pipeline
// ---------------------------------------------------------------------------

export interface IngestionResult {
  source: string;
  fetched: number;
  upserted: number;
  newTrends: number;
  errors: number;
}

export interface IngestionRunResult {
  startedAt: Date;
  completedAt: Date;
  sources: IngestionResult[];
  totalNew: number;
  totalUpserted: number;
  totalErrors: number;
}

/**
 * Run a full ingestion cycle across all registered sources.
 */
export async function runIngestion(): Promise<IngestionRunResult> {
  const startedAt = new Date();
  const results: IngestionResult[] = [];

  for (const source of sources) {
    const result = await ingestSource(source);
    results.push(result);
  }

  const completedAt = new Date();
  const totalNew = results.reduce((s, r) => s + r.newTrends, 0);
  const totalUpserted = results.reduce((s, r) => s + r.upserted, 0);
  const totalErrors = results.reduce((s, r) => s + r.errors, 0);

  console.log(
    `[ingestion] Run complete: ${totalUpserted} upserted, ${totalNew} new, ${totalErrors} errors (${completedAt.getTime() - startedAt.getTime()}ms)`
  );

  return { startedAt, completedAt, sources: results, totalNew, totalUpserted, totalErrors };
}

// ---------------------------------------------------------------------------
// Per-source ingestion
// ---------------------------------------------------------------------------

async function ingestSource(source: ProductSource): Promise<IngestionResult> {
  const result: IngestionResult = {
    source: source.name,
    fetched: 0,
    upserted: 0,
    newTrends: 0,
    errors: 0,
  };

  // 1. Fetch raw products
  let rawProducts: CanonicalProduct[];
  try {
    rawProducts = await source.fetch();
    result.fetched = rawProducts.length;
    console.log(`[ingestion:${source.name}] Fetched ${rawProducts.length} products`);
  } catch (err) {
    console.error(`[ingestion:${source.name}] Fetch failed:`, err);
    result.errors = 1;
    return result;
  }

  // 2. Normalize & filter
  const normalized: CanonicalProduct[] = [];
  const seen = new Set<string>();

  for (const raw of rawProducts) {
    const product = normalizeProduct(raw);
    if (!product) {
      result.errors++;
      continue;
    }

    // Deduplicate within this batch
    const key = `${product.source}:${product.externalId}`;
    if (seen.has(key)) continue;
    seen.add(key);

    normalized.push(product);
  }

  // 3. Process in batches
  for (let i = 0; i < normalized.length; i += BATCH_SIZE) {
    const batch = normalized.slice(i, i + BATCH_SIZE);
    await processBatch(batch, result);
  }

  console.log(
    `[ingestion:${source.name}] Done: ${result.upserted} upserted, ${result.newTrends} new, ${result.errors} errors`
  );

  return result;
}

// ---------------------------------------------------------------------------
// Batch processor
// ---------------------------------------------------------------------------

async function processBatch(
  products: CanonicalProduct[],
  result: IngestionResult,
): Promise<void> {
  for (const product of products) {
    try {
      await processProduct(product, result);
    } catch (err) {
      result.errors++;
      console.error(
        `[ingestion:${product.source}] Failed to process ${product.externalId}:`,
        err
      );
    }
  }
}

async function processProduct(
  product: CanonicalProduct,
  result: IngestionResult,
): Promise<void> {
  // Compute a base trend score (sources can provide their own scorer;
  // for now use a simple heuristic based on price stability)
  const baseTrendScore = 50; // Default; overridden if source supplies scoring

  // Upsert trend
  const { trend, isNew } = await storage.upsertTrendByExternalId(
    product.externalId,
    product.source,
    {
      name: product.title,
      category: product.category,
      description: `Trending on ${product.source}. ${product.currency} ${product.price.toFixed(2)}.`,
      trendScore: baseTrendScore,
      productUrl: product.productUrl,
      imageUrl: product.imageUrl,
      sourcePlatform: product.source,
      externalId: product.externalId,
      detectedAt: new Date(),
    }
  );

  result.upserted++;

  if (isNew) {
    result.newTrends++;
    ingestionEvents.emit(EVENT_NEW_TREND, trend);
    console.log(`[ingestion] New trend discovered: "${trend.name}" (id=${trend.id})`);
  }

  // Append price snapshot
  await storage.createPriceSnapshot({
    trendId: trend.id,
    source: product.source,
    price: product.price.toFixed(2),
    recordedAt: new Date(),
  });

  // Compute velocity from last two snapshots, then recompute composite score
  await computeVelocityAndScore(trend, product.source);
}

// ---------------------------------------------------------------------------
// Velocity computation + score recomputation
// ---------------------------------------------------------------------------

async function computeVelocityAndScore(trend: Trend, source: string): Promise<void> {
  const snapshots = await storage.getLastTwoPriceSnapshots(trend.id);
  let velocity: string | null = null;

  if (snapshots.length >= 2) {
    const current = parseFloat(snapshots[0].price);
    const previous = parseFloat(snapshots[1].price);

    if (previous !== 0) {
      const pctChange = ((current - previous) / previous) * 100;
      velocity = pctChange.toFixed(2);
      await storage.updateTrendVelocity(trend.id, velocity);
    }
  }

  // Recompute composite score using all available signals
  const snapshotCount = await storage.getSnapshotCount(trend.id);
  const { trendScore } = calculateTrendScore({
    rawScore: trend.trendScore,
    priceVelocity: velocity,
    sourcePlatform: source,
    snapshotCount,
  });

  await storage.updateTrendScore(trend.id, trendScore);
}
