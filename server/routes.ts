import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { registerChatRoutes } from "./replit_integrations/chat";
import { registerImageRoutes } from "./replit_integrations/image";
import { registerAudioRoutes } from "./replit_integrations/audio";

import { trendService } from "./services/trendService";
import { priceService } from "./services/priceService";
import { aiService } from "./services/aiService";
import { startTrendCron, triggerIngestion, getIngestionStatus } from "./jobs/trendCron";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Auth Setup
  await setupAuth(app);
  registerAuthRoutes(app);

  // Integrations
  registerChatRoutes(app);
  registerImageRoutes(app);
  registerAudioRoutes(app);

  // API Routes

  // Trends
  app.get(api.trends.list.path, async (req, res) => {
    const category = req.query.category as string | undefined;
    const search = req.query.search as string | undefined;
    const trends = await trendService.getTrends(category, search);
    res.json(trends);
  });

  app.get(api.trends.get.path, async (req, res) => {
    const id = parseInt(req.params.id);
    const trend = await trendService.getTrend(id);
    if (!trend) {
      return res.status(404).json({ message: "Trend not found" });
    }
    res.json(trend);
  });

  app.post(api.trends.create.path, isAuthenticated, async (req, res) => {
    try {
      const input = api.trends.create.input.parse(req.body);
      const trend = await storage.createTrend(input);
      res.status(201).json(trend);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.get(api.trends.getPrices.path, async (req, res) => {
    const id = parseInt(req.params.id);
    const prices = await storage.getPriceSnapshots(id);
    const analytics = await storage.getTrendAnalytics(id);
    res.json({ snapshots: prices, intelligence: analytics });
  });

  // AI Recommendation (Sanitized)
  app.get("/api/trends/:id/recommendation", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const trend = await trendService.getTrend(id);
      if (!trend) return res.status(404).json({ message: "Trend not found" });

      const priceResult = await priceService.getTrendPrices(id);
      const recommendation = await aiService.getTrendRecommendation(
        id,
        trend.trendScore,
        priceResult.intelligence.percentile,
        priceResult.intelligence.label
      );

      res.json({ recommendation });
    } catch (error) {
      console.error("AI Recommendation Error:", error);
      res.status(500).json({ message: "Failed to generate recommendation" });
    }
  });


  app.get(api.trends.getHashes.path, async (req, res) => {
    const id = parseInt(req.params.id);
    const hashes = await storage.getTrendHashes(id);
    res.json(hashes);
  });

  // Executions
  app.post(api.executions.create.path, isAuthenticated, async (req: any, res) => {
    try {
      const input = api.executions.create.input.parse(req.body);
      // Get userId from session
      const userId = req.user?.claims?.sub;
      if (!userId) return res.status(401).json({ message: "Unauthorized" });

      const log = await storage.createExecutionLog({
        ...input,
        userId
      });
      res.status(201).json(log);
    } catch (err) {
      if (err instanceof z.ZodError) {
        return res.status(400).json({ message: err.errors[0].message });
      }
      res.status(500).json({ message: "Internal Server Error" });
    }
  });

  app.get(api.executions.listByUser.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user?.claims?.sub;
    // Ensure user can only see their own executions or admin
    if (req.params.id !== userId) {
       // Ideally check role, but for MVP strict on own ID
       return res.status(401).json({ message: "Unauthorized" });
    }
    const logs = await storage.getExecutionLogs(userId);
    res.json(logs);
  });

  // Wallet
  app.patch(api.auth.updateWallet.path, isAuthenticated, async (req: any, res) => {
    const userId = req.user?.claims?.sub;
    const { walletAddress } = req.body;
    if (!walletAddress) return res.status(400).json({ message: "Wallet address required" });

    const updatedUser = await storage.updateUserWallet(userId, walletAddress);
    res.json(updatedUser);
  });

  // Crypto Market Proxy (CoinGecko Workaround)
  app.get("/api/market/top-assets", async (req, res) => {
    try {
      const perPage = req.query.per_page || "50";
      const response = await fetch(`https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${perPage}&page=1&sparkline=false`);
      const data = await response.json();

      if (data.status?.error_code === 429) {
        return res.status(429).json({ message: "Rate limit exceeded" });
      }

      if (!Array.isArray(data)) {
        return res.status(500).json({ message: "Invalid data format from provider" });
      }

      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch market data" });
    }
  });

  // ---- Ingestion Admin Routes ----

  // Manual trigger — POST so it's not accidentally hit by crawlers
  app.post("/api/admin/ingestion/run", isAuthenticated, async (req: any, res) => {
    try {
      const result = await triggerIngestion();
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Ingestion trigger failed" });
    }
  });

  // Status / health check
  app.get("/api/admin/ingestion/status", async (_req, res) => {
    res.json(getIngestionStatus());
  });

  // Start the cron scheduler
  startTrendCron();

  return httpServer;
}
