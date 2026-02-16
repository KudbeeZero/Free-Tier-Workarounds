/**
 * Cron scheduler for the trend ingestion pipeline.
 *
 * Schedules:
 *   - Twice daily at 06:00 and 18:00 UTC (production cadence)
 *   - Runs immediately on first startup so the DB is populated without
 *     waiting for the first scheduled tick
 *
 * Manual trigger:
 *   Import `triggerIngestion()` from this module to fire a run on demand
 *   (used by the admin API route).
 */

import cron, { type ScheduledTask } from "node-cron";
import { runIngestion, ingestionEvents, EVENT_NEW_TREND } from "../services/ingestionService";
import { seedMockData } from "../seedData";
import type { Trend } from "@shared/schema";

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

let isRunning = false;
let lastRunAt: Date | null = null;
let scheduledTask: ScheduledTask | null = null;

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Start the cron schedule. Safe to call multiple times — subsequent
 * calls are no-ops if the schedule is already active.
 */
export function startTrendCron(): void {
  if (scheduledTask) return;

  // Log new trend discoveries (future: trigger blockchain stamping)
  ingestionEvents.on(EVENT_NEW_TREND, (trend: Trend) => {
    console.log(
      `[cron] EVENT new trend discovered: id=${trend.id} name="${trend.name}" source=${trend.sourcePlatform}`
    );
  });

  // Twice daily: 06:00 and 18:00 UTC
  scheduledTask = cron.schedule("0 6,18 * * *", async () => {
    await triggerIngestion();
  }, {
    timezone: "UTC",
  });

  console.log("[cron] Trend ingestion scheduled: 06:00 & 18:00 UTC");

  // Fire initial seed + ingestion after a short delay so the server can finish booting
  setTimeout(async () => {
    try {
      await seedMockData();
    } catch (err) {
      console.error("[cron] Seed failed (non-fatal):", err);
    }
    console.log("[cron] Running initial ingestion on startup...");
    triggerIngestion();
  }, 3000);
}

/**
 * Stop the cron schedule (for graceful shutdown).
 */
export function stopTrendCron(): void {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
    console.log("[cron] Trend ingestion stopped");
  }
}

/**
 * Manually trigger an ingestion run. Returns summary of the run.
 * Rejects if a run is already in progress.
 */
export async function triggerIngestion() {
  if (isRunning) {
    console.log("[cron] Ingestion already in progress, skipping");
    return { status: "skipped", reason: "already_running" } as const;
  }

  isRunning = true;
  try {
    const result = await runIngestion();
    lastRunAt = result.completedAt;
    return { status: "completed", result } as const;
  } catch (err) {
    console.error("[cron] Ingestion run failed:", err);
    return { status: "failed", error: String(err) } as const;
  } finally {
    isRunning = false;
  }
}

/**
 * Health check data for monitoring.
 */
export function getIngestionStatus() {
  return {
    isRunning,
    lastRunAt,
    cronActive: scheduledTask !== null,
  };
}
