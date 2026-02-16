import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar, index } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ==========================================
// AUTH & USERS (Extended from Replit Auth)
// ==========================================
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  // App specific fields
  walletAddress: text("wallet_address"),
  role: text("role").default("user").notNull(), // 'user' | 'admin'
});

export const sessions = pgTable("sessions", {
  sid: varchar("sid").primaryKey(),
  sess: jsonb("sess").notNull(),
  expire: timestamp("expire").notNull(),
}, (table) => [index("IDX_session_expire").on(table.expire)]);

// ==========================================
// CHAT (From Replit AI Integration)
// ==========================================
export const conversations = pgTable("conversations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  conversationId: integer("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  role: text("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
});

// ==========================================
// APP SPECIFIC TABLES
// ==========================================

export const trends = pgTable("trends", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  description: text("description").notNull(),
  trendScore: integer("trend_score").notNull(),
  productUrl: text("product_url"),
  imageUrl: text("image_url"),
  estimatedMargin: text("estimated_margin"),
  sourcePlatform: text("source_platform"), // e.g., 'tiktok', 'aliexpress'
  externalId: text("external_id"), // Unique product ID from source platform
  priceVelocity: text("price_velocity"), // Percent change between last two snapshots
  detectedAt: timestamp("detected_at").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => [
  index("idx_trends_external_source").on(table.externalId, table.sourcePlatform),
]);

export const trendHashes = pgTable("trend_hashes", {
  id: serial("id").primaryKey(),
  trendId: integer("trend_id").notNull().references(() => trends.id),
  hash: text("hash").notNull(),
  blockchainTxId: text("blockchain_tx_id").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const priceSnapshots = pgTable("price_snapshots", {
  id: serial("id").primaryKey(),
  trendId: integer("trend_id").notNull().references(() => trends.id),
  source: text("source").notNull(),
  price: text("price").notNull(), // Storing as text to avoid precision issues, or use decimal/numeric if supported
  recordedAt: timestamp("recorded_at").defaultNow().notNull(),
});

export const executionLogs = pgTable("execution_logs", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  trendId: integer("trend_id").notNull().references(() => trends.id),
  executionType: text("execution_type").notNull(), // 'buy', 'sell', etc.
  referenceUrl: text("reference_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ==========================================
// RELATIONS
// ==========================================
export const usersRelations = relations(users, ({ many }) => ({
  executionLogs: many(executionLogs),
}));

export const trendsRelations = relations(trends, ({ many }) => ({
  hashes: many(trendHashes),
  priceSnapshots: many(priceSnapshots),
  executionLogs: many(executionLogs),
}));

export const executionLogsRelations = relations(executionLogs, ({ one }) => ({
  user: one(users, {
    fields: [executionLogs.userId],
    references: [users.id],
  }),
  trend: one(trends, {
    fields: [executionLogs.trendId],
    references: [trends.id],
  }),
}));

export const trendHashesRelations = relations(trendHashes, ({ one }) => ({
  trend: one(trends, {
    fields: [trendHashes.trendId],
    references: [trends.id],
  }),
}));

export const priceSnapshotsRelations = relations(priceSnapshots, ({ one }) => ({
  trend: one(trends, {
    fields: [priceSnapshots.trendId],
    references: [trends.id],
  }),
}));

// ==========================================
// SCHEMAS
// ==========================================

// Auth
export const insertUserSchema = createInsertSchema(users).omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

// Chat
export const insertConversationSchema = createInsertSchema(conversations).omit({
  id: true,
  createdAt: true,
});
export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

// App
export const insertTrendSchema = createInsertSchema(trends).omit({ 
  id: true, 
  createdAt: true 
});
export const insertTrendHashSchema = createInsertSchema(trendHashes).omit({ 
  id: true 
});
export const insertPriceSnapshotSchema = createInsertSchema(priceSnapshots).omit({ 
  id: true 
});
export const insertExecutionLogSchema = createInsertSchema(executionLogs).omit({ 
  id: true, 
  createdAt: true 
});

// ==========================================
// TYPES
// ==========================================

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = InsertUser; // For Auth compatibility

export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;

export type Trend = typeof trends.$inferSelect;
export type InsertTrend = z.infer<typeof insertTrendSchema>;

export type TrendHash = typeof trendHashes.$inferSelect;
export type InsertTrendHash = z.infer<typeof insertTrendHashSchema>;

export type PriceSnapshot = typeof priceSnapshots.$inferSelect;
export type InsertPriceSnapshot = z.infer<typeof insertPriceSnapshotSchema>;

export type ExecutionLog = typeof executionLogs.$inferSelect;
export type InsertExecutionLog = z.infer<typeof insertExecutionLogSchema>;
