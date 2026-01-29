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

  // Seed Data
  await seedDatabase();

  return httpServer;
}

async function seedDatabase() {
  const trendsList = await storage.getTrends();
  if (trendsList.length === 0) {
    console.log("Seeding database...");
    
    const products = [
      {
        name: "Portable Neck Fan",
        category: "Electronics",
        description: "Hands-free cooling solution viral on TikTok. High demand for summer travel.",
        trendScore: 92,
        productUrl: "https://example.com/product/neck-fan",
        estimatedMargin: "65%",
        sourcePlatform: "TikTok",
        imageUrl: "https://images.unsplash.com/photo-1591129841117-3adfd313e34f?auto=format&fit=crop&q=80&w=200",
        detectedAt: new Date(),
      },
      {
        name: "Self-Cleaning Mop",
        category: "Home & Garden",
        description: "High-demand cleaning tool for modern homes. Revolving bucket system.",
        trendScore: 88,
        productUrl: "https://example.com/product/mop",
        estimatedMargin: "50%",
        sourcePlatform: "AliExpress",
        imageUrl: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&q=80&w=200",
        detectedAt: new Date(),
      },
      {
        name: "Ergonomic Pet Bed",
        category: "Pet Supplies",
        description: "Orthopedic comfort for pets, trending on Instagram with 'dog influencers'.",
        trendScore: 85,
        productUrl: "https://example.com/product/pet-bed",
        estimatedMargin: "45%",
        sourcePlatform: "Instagram",
        imageUrl: "https://images.unsplash.com/photo-1541599540903-216a46ca1df0?auto=format&fit=crop&q=80&w=200",
        detectedAt: new Date(),
      },
      {
        name: "Smart Sleep Mask",
        category: "Electronics",
        description: "Bluetooth enabled sleep mask with white noise. Growing wellness trend.",
        trendScore: 94,
        productUrl: "https://example.com/product/sleep-mask",
        estimatedMargin: "70%",
        sourcePlatform: "TikTok",
        imageUrl: "https://images.unsplash.com/photo-1517639493569-5666a7b2f494?auto=format&fit=crop&q=80&w=200",
        detectedAt: new Date(),
      },
      {
        name: "Sunset Projection Lamp",
        category: "Home & Garden",
        description: "Atmospheric lighting viral for room aesthetic videos.",
        trendScore: 91,
        productUrl: "https://example.com/product/sunset-lamp",
        estimatedMargin: "60%",
        sourcePlatform: "Pinterest",
        imageUrl: "https://images.unsplash.com/photo-1619191163420-4a7c019888a4?auto=format&fit=crop&q=80&w=200",
        detectedAt: new Date(),
      }
    ];

    for (const p of products) {
      const trend = await storage.createTrend(p);
      
      // Seed historical prices for prediction visualization
      const basePrice = Math.random() * 30 + 10;
      for (let i = 0; i < 5; i++) {
        await storage.createPriceSnapshot({
          trendId: trend.id,
          source: p.sourcePlatform,
          price: (basePrice + (Math.random() * 5 - 2.5)).toFixed(2),
          recordedAt: new Date(Date.now() - (86400000 * (5 - i))),
        });
      }

      await storage.createTrendHash({
        trendId: trend.id,
        hash: Math.random().toString(36).substring(7),
        blockchainTxId: `TX${Math.random().toString(36).substring(7).toUpperCase()}`,
        timestamp: new Date(),
      });
    }

    console.log("Database seeded with enhanced product data!");
  }
}
