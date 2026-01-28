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
    const result = await priceService.getTrendPrices(id);
    res.json(result);
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
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch market data" });
    }
  });

  // Seed Data
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const trendsList = await storage.getTrends();
  if (trendsList.length === 0) {
    console.log("Seeding database...");
    
    // Create Trends
    const trend1 = await storage.createTrend({
      name: "Portable Neck Fan",
      category: "Electronics",
      description: "Hands-free cooling solution viral on TikTok.",
      trendScore: 92,
      productUrl: "https://example.com/product/neck-fan",
      estimatedMargin: "65%",
      sourcePlatform: "TikTok",
      detectedAt: new Date(),
    });

    const trend2 = await storage.createTrend({
      name: "Self-Cleaning Mop",
      category: "Home & Garden",
      description: "High-demand cleaning tool for modern homes.",
      trendScore: 88,
      productUrl: "https://example.com/product/mop",
      estimatedMargin: "50%",
      sourcePlatform: "AliExpress",
      detectedAt: new Date(),
    });

    const trend3 = await storage.createTrend({
      name: "Ergonomic Pet Bed",
      category: "Pet Supplies",
      description: "Orthopedic comfort for pets, trending on Instagram.",
      trendScore: 85,
      productUrl: "https://example.com/product/pet-bed",
      estimatedMargin: "45%",
      sourcePlatform: "Instagram",
      detectedAt: new Date(),
    });

    // Create Price Snapshots
    await storage.createPriceSnapshot({
      trendId: trend1.id,
      source: "CoinGecko",
      price: "1.25",
      recordedAt: new Date(Date.now() - 86400000 * 2),
    });
    await storage.createPriceSnapshot({
      trendId: trend1.id,
      source: "CoinGecko",
      price: "1.32",
      recordedAt: new Date(Date.now() - 86400000),
    });
    await storage.createPriceSnapshot({
      trendId: trend1.id,
      source: "CoinGecko",
      price: "1.45",
      recordedAt: new Date(),
    });

    // Create Hashes
    await storage.createTrendHash({
      trendId: trend1.id,
      hash: "8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4",
      blockchainTxId: "U4E6D...9X8A",
      timestamp: new Date(),
    });

    console.log("Database seeded!");
  }
}
