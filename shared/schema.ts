import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Twitch Channel Schema
export const twitchChannels = pgTable("twitch_channels", {
  id: serial("id").primaryKey(),
  channelName: text("channel_name").notNull().unique(),
  channelId: text("channel_id"),
  isLive: boolean("is_live").default(false),
  viewerCount: integer("viewer_count").default(0),
  pointsCollected: integer("points_collected").default(0),
  watchTimeMinutes: integer("watch_time_minutes").default(0),
  bonusClaims: integer("bonus_claims").default(0),
  lastUpdated: timestamp("last_updated").defaultNow(),
  isActive: boolean("is_active").default(true),
  autoClaimPoints: boolean("auto_claim_points").default(true),
  claimBonuses: boolean("claim_bonuses").default(true),
  sendLogsToDiscord: boolean("send_logs_to_discord").default(true),
  autoFollow: boolean("auto_follow").default(false),
  priority: text("priority").default("medium"),
});

export const insertTwitchChannelSchema = createInsertSchema(twitchChannels).pick({
  channelName: true,
  autoClaimPoints: true,
  claimBonuses: true,
  sendLogsToDiscord: true,
  autoFollow: true,
  priority: true,
});

export type InsertTwitchChannel = z.infer<typeof insertTwitchChannelSchema>;
export type TwitchChannel = typeof twitchChannels.$inferSelect;

// Activity Log Schema
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  channelId: integer("channel_id"),
  channelName: text("channel_name"),
  activityType: text("activity_type").notNull(), // points, bonus, live, offline, error, connection
  message: text("message").notNull(),
  pointsGained: integer("points_gained").default(0),
  timestamp: timestamp("timestamp").defaultNow(),
  sentToDiscord: boolean("sent_to_discord").default(false),
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).pick({
  channelId: true,
  channelName: true,
  activityType: true,
  message: true,
  pointsGained: true,
  sentToDiscord: true,
});

export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;

// Settings Schema
export const settings = pgTable("settings", {
  id: serial("id").primaryKey(),
  twitchUsername: text("twitch_username"),
  twitchClientId: text("twitch_client_id"),
  twitchAccessToken: text("twitch_access_token"),
  twitchRefreshToken: text("twitch_refresh_token"),
  discordWebhookUrl: text("discord_webhook_url"),
  maxConcurrentChannels: integer("max_concurrent_channels").default(5),
  refreshInterval: integer("refresh_interval").default(60), // in seconds
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const insertSettingsSchema = createInsertSchema(settings).omit({
  id: true,
  lastUpdated: true,
});

export type InsertSettings = z.infer<typeof insertSettingsSchema>;
export type Settings = typeof settings.$inferSelect;

// Stats Schema
export const stats = pgTable("stats", {
  id: serial("id").primaryKey(),
  totalPointsCollected: integer("total_points_collected").default(0),
  totalWatchTimeMinutes: integer("total_watch_time_minutes").default(0),
  totalBonusClaims: integer("total_bonus_claims").default(0),
  activeChannels: integer("active_channels").default(0),
  pointsPerHour: integer("points_per_hour").default(0),
  startDate: timestamp("start_date").defaultNow(),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const insertStatsSchema = createInsertSchema(stats).omit({
  id: true,
  lastUpdated: true,
});

export type InsertStats = z.infer<typeof insertStatsSchema>;
export type Stats = typeof stats.$inferSelect;
