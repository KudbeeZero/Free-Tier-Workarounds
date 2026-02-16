import {
  users, trends, trendHashes, priceSnapshots, executionLogs,
  type User, type InsertUser,
  type Trend, type InsertTrend,
  type TrendHash, type InsertTrendHash,
  type PriceSnapshot, type InsertPriceSnapshot,
  type ExecutionLog, type InsertExecutionLog
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, ilike } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserWallet(id: string, walletAddress: string): Promise<User>;

  // Trends
  getTrends(category?: string, search?: string): Promise<Trend[]>;
  getTrend(id: number): Promise<Trend | undefined>;
  createTrend(trend: InsertTrend): Promise<Trend>;

  // Trend Hashes
  getTrendHashes(trendId: number): Promise<TrendHash[]>;
  createTrendHash(hash: InsertTrendHash): Promise<TrendHash>;

  // Price Snapshots
  getPriceSnapshots(trendId: number): Promise<PriceSnapshot[]>;
  createPriceSnapshot(snapshot: InsertPriceSnapshot): Promise<PriceSnapshot>;

  // Execution Logs
  getExecutionLogs(userId: string): Promise<ExecutionLog[]>;
  createExecutionLog(log: InsertExecutionLog): Promise<ExecutionLog>;

  // Ingestion
  upsertTrendByExternalId(externalId: string, sourcePlatform: string, data: InsertTrend): Promise<{ trend: Trend; isNew: boolean }>;
  getLastTwoPriceSnapshots(trendId: number): Promise<PriceSnapshot[]>;
  updateTrendVelocity(trendId: number, velocity: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUserWallet(id: string, walletAddress: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ walletAddress })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Trends
  async getTrends(category?: string, search?: string): Promise<Trend[]> {
    const conditions = [];
    if (category) {
      conditions.push(eq(trends.category, category));
    }
    if (search) {
      conditions.push(ilike(trends.name, `%${search}%`));
    }
    let query = db.select().from(trends);
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    return await query.orderBy(desc(trends.trendScore));
  }

  async getTrend(id: number): Promise<Trend | undefined> {
    const [trend] = await db.select().from(trends).where(eq(trends.id, id));
    return trend;
  }

  async createTrend(trend: InsertTrend): Promise<Trend> {
    const [newTrend] = await db.insert(trends).values(trend).returning();
    return newTrend;
  }

  // Trend Hashes
  async getTrendHashes(trendId: number): Promise<TrendHash[]> {
    return await db.select().from(trendHashes).where(eq(trendHashes.trendId, trendId)).orderBy(desc(trendHashes.timestamp));
  }

  async createTrendHash(hash: InsertTrendHash): Promise<TrendHash> {
    const [newHash] = await db.insert(trendHashes).values(hash).returning();
    return newHash;
  }

  // Price Snapshots
  async getPriceSnapshots(trendId: number): Promise<PriceSnapshot[]> {
    return await db.select().from(priceSnapshots).where(eq(priceSnapshots.trendId, trendId)).orderBy(priceSnapshots.recordedAt);
  }

  async getTrendAnalytics(trendId: number) {
    const prices = await this.getPriceSnapshots(trendId);
    if (prices.length === 0) return null;

    const numericPrices = prices.map(p => parseFloat(p.price));
    const lowest = Math.min(...numericPrices);
    const current = numericPrices[numericPrices.length - 1];
    
    // Simple linear projection for "future price"
    const last = numericPrices[numericPrices.length - 1];
    const prev = numericPrices[numericPrices.length - 2] || last;
    const diff = last - prev;
    const predicted = last + (diff * 1.5); // Slightly aggressive projection for "future prediction"

    return {
      lowestPrice: lowest.toFixed(2),
      currentPrice: current.toFixed(2),
      predictedPrice: predicted.toFixed(2),
      confidence: diff > 0 ? "High" : "Stable"
    };
  }

  async createPriceSnapshot(snapshot: InsertPriceSnapshot): Promise<PriceSnapshot> {
    const [newSnapshot] = await db.insert(priceSnapshots).values(snapshot).returning();
    return newSnapshot;
  }

  // Execution Logs
  async getExecutionLogs(userId: string): Promise<ExecutionLog[]> {
    return await db.select().from(executionLogs).where(eq(executionLogs.userId, userId)).orderBy(desc(executionLogs.createdAt));
  }

  async createExecutionLog(log: InsertExecutionLog): Promise<ExecutionLog> {
    const [newLog] = await db.insert(executionLogs).values(log).returning();
    return newLog;
  }

  // ---- Ingestion helpers ----

  async upsertTrendByExternalId(
    externalId: string,
    sourcePlatform: string,
    data: InsertTrend
  ): Promise<{ trend: Trend; isNew: boolean }> {
    // Check if this external product already exists
    const [existing] = await db
      .select()
      .from(trends)
      .where(and(eq(trends.externalId, externalId), eq(trends.sourcePlatform, sourcePlatform)));

    if (existing) {
      // Update mutable fields (title, image, category, score may change)
      const [updated] = await db
        .update(trends)
        .set({
          name: data.name,
          imageUrl: data.imageUrl,
          category: data.category,
          productUrl: data.productUrl,
          trendScore: data.trendScore,
        })
        .where(eq(trends.id, existing.id))
        .returning();
      return { trend: updated, isNew: false };
    }

    // Insert new trend
    const [created] = await db.insert(trends).values(data).returning();
    return { trend: created, isNew: true };
  }

  async getLastTwoPriceSnapshots(trendId: number): Promise<PriceSnapshot[]> {
    return await db
      .select()
      .from(priceSnapshots)
      .where(eq(priceSnapshots.trendId, trendId))
      .orderBy(desc(priceSnapshots.recordedAt))
      .limit(2);
  }

  async updateTrendVelocity(trendId: number, velocity: string): Promise<void> {
    await db
      .update(trends)
      .set({ priceVelocity: velocity })
      .where(eq(trends.id, trendId));
  }
}

export const storage = new DatabaseStorage();
