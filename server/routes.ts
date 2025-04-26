import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { initializeTwitchFarming, stopTwitchFarming } from "./twitch";
import { sendDiscordWebhook, sendPendingWebhooks, sendDailySummary } from "./discord";
import { insertTwitchChannelSchema, insertSettingsSchema, insertAccessKeySchema } from "@shared/schema";
import { ZodError } from "zod";
import { fromZodError } from "zod-validation-error";
import crypto from "crypto";

export async function registerRoutes(app: Express): Promise<Server> {
  // Seed an admin key if no keys exist
  const setupInitialAdminKey = async () => {
    const keys = await storage.getKeys();
    if (keys.length === 0) {
      const adminKey = crypto.randomBytes(16).toString('hex');
      await storage.createKey({
        key: adminKey,
        label: "Admin Key (Initial)",
        isAdmin: true,
        isActive: true,
        expiresAt: null
      });
      console.log("Created initial admin key:", adminKey);
    }
  };
  
  await setupInitialAdminKey();
  
  // Authentication middleware using access keys
  const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
    const keyValue = req.headers['x-api-key'] as string || req.query.key as string;
    if (!keyValue) {
      return res.status(401).json({ message: "Access key required" });
    }
    
    const isValid = await storage.validateKey(keyValue);
    if (!isValid) {
      return res.status(403).json({ message: "Invalid or inactive access key" });
    }
    
    next();
  };
  
  // Admin authentication middleware
  const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
    const keyValue = req.headers['x-api-key'] as string || req.query.key as string;
    if (!keyValue) {
      return res.status(401).json({ message: "Access key required" });
    }
    
    const isAdmin = await storage.validateAdminKey(keyValue);
    if (!isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    next();
  };

  // API Routes
  app.get("/api/channels", requireAuth, async (req, res) => {
    try {
      const channels = await storage.getChannels();
      res.json(channels);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch channels" });
    }
  });

  app.get("/api/channels/active", requireAuth, async (req, res) => {
    try {
      const channels = await storage.getActiveChannels();
      res.json(channels);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch active channels" });
    }
  });

  app.get("/api/channels/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid channel ID" });
      }

      const channel = await storage.getChannel(id);
      if (!channel) {
        return res.status(404).json({ message: "Channel not found" });
      }

      res.json(channel);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch channel" });
    }
  });

  app.post("/api/channels", requireAuth, async (req, res) => {
    try {
      const validatedData = insertTwitchChannelSchema.parse(req.body);
      const existingChannel = await storage.getChannelByName(validatedData.channelName);
      
      if (existingChannel) {
        return res.status(409).json({ message: "Channel already exists" });
      }
      
      const channel = await storage.createChannel(validatedData);
      
      // Log channel creation
      const log = await storage.createLog({
        channelId: channel.id,
        channelName: channel.channelName,
        activityType: "connection",
        message: `Added channel ${channel.channelName} to farming`,
        pointsGained: 0,
        sentToDiscord: false
      });
      
      if (channel.sendLogsToDiscord) {
        await sendDiscordWebhook(log);
      }
      
      res.status(201).json(channel);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to create channel" });
    }
  });

  app.patch("/api/channels/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid channel ID" });
      }

      const channel = await storage.getChannel(id);
      if (!channel) {
        return res.status(404).json({ message: "Channel not found" });
      }

      // Only allow updating certain fields
      const allowedUpdates = [
        "isActive", "autoClaimPoints", "claimBonuses", 
        "sendLogsToDiscord", "autoFollow", "priority"
      ];
      
      const updates: Record<string, any> = {};
      for (const key of allowedUpdates) {
        if (req.body[key] !== undefined) {
          updates[key as keyof typeof updates] = req.body[key];
        }
      }

      const updatedChannel = await storage.updateChannel(id, updates);
      res.json(updatedChannel);
    } catch (error) {
      res.status(500).json({ message: "Failed to update channel" });
    }
  });

  app.delete("/api/channels/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid channel ID" });
      }

      const channel = await storage.getChannel(id);
      if (!channel) {
        return res.status(404).json({ message: "Channel not found" });
      }

      await storage.deleteChannel(id);
      
      // Log channel deletion
      await storage.createLog({
        channelId: undefined,
        channelName: channel.channelName,
        activityType: "connection",
        message: `Removed channel ${channel.channelName} from farming`,
        pointsGained: 0,
        sentToDiscord: false
      });
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete channel" });
    }
  });

  app.get("/api/logs", requireAuth, async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const logs = await storage.getLogs(limit);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch logs" });
    }
  });

  app.get("/api/logs/channel/:id", requireAuth, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid channel ID" });
      }

      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const logs = await storage.getLogsByChannel(id, limit);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch channel logs" });
    }
  });

  app.get("/api/settings", requireAuth, async (req, res) => {
    try {
      const settings = await storage.getSettings();
      
      // Don't return sensitive tokens in response
      if (settings) {
        const { twitchAccessToken, twitchRefreshToken, ...safeSettings } = settings;
        res.json({
          ...safeSettings,
          hasAccessToken: !!twitchAccessToken,
          hasRefreshToken: !!twitchRefreshToken
        });
      } else {
        res.json(null);
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.post("/api/settings", requireAuth, async (req, res) => {
    try {
      const validatedData = insertSettingsSchema.parse(req.body);
      const settings = await storage.saveSettings(validatedData);
      
      // Don't return sensitive tokens in response
      const { twitchAccessToken, twitchRefreshToken, ...safeSettings } = settings;
      res.json({
        ...safeSettings,
        hasAccessToken: !!twitchAccessToken,
        hasRefreshToken: !!twitchRefreshToken
      });
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to save settings" });
    }
  });

  app.patch("/api/settings", requireAuth, async (req, res) => {
    try {
      const settings = await storage.getSettings();
      if (!settings) {
        return res.status(404).json({ message: "Settings not found" });
      }

      const updatedSettings = await storage.updateSettings(req.body);
      
      if (updatedSettings) {
        // Don't return sensitive tokens in response
        const { twitchAccessToken, twitchRefreshToken, ...safeSettings } = updatedSettings;
        res.json({
          ...safeSettings,
          hasAccessToken: !!twitchAccessToken,
          hasRefreshToken: !!twitchRefreshToken
        });
      } else {
        res.status(500).json({ message: "Failed to update settings" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to update settings" });
    }
  });

  app.get("/api/stats", requireAuth, async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch stats" });
    }
  });

  // Control routes
  app.post("/api/control/start", requireAuth, async (req, res) => {
    try {
      const success = await initializeTwitchFarming();
      if (success) {
        res.json({ message: "Twitch farming started" });
      } else {
        res.status(500).json({ message: "Failed to start Twitch farming" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to start Twitch farming" });
    }
  });

  app.post("/api/control/stop", requireAuth, async (req, res) => {
    try {
      stopTwitchFarming();
      res.json({ message: "Twitch farming stopped" });
    } catch (error) {
      res.status(500).json({ message: "Failed to stop Twitch farming" });
    }
  });

  app.post("/api/control/send-webhook-test", requireAuth, async (req, res) => {
    try {
      const testLog = await storage.createLog({
        channelId: undefined,
        channelName: undefined,
        activityType: "connection",
        message: "Test webhook message",
        pointsGained: 0,
        sentToDiscord: false
      });
      
      const success = await sendDiscordWebhook(testLog);
      if (success) {
        res.json({ message: "Test webhook sent successfully" });
      } else {
        res.status(500).json({ message: "Failed to send test webhook" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to send test webhook" });
    }
  });

  app.post("/api/control/send-pending-webhooks", requireAuth, async (req, res) => {
    try {
      await sendPendingWebhooks();
      res.json({ message: "Pending webhooks sent" });
    } catch (error) {
      res.status(500).json({ message: "Failed to send pending webhooks" });
    }
  });

  app.post("/api/control/send-daily-summary", requireAuth, async (req, res) => {
    try {
      const success = await sendDailySummary();
      if (success) {
        res.json({ message: "Daily summary sent" });
      } else {
        res.status(500).json({ message: "Failed to send daily summary" });
      }
    } catch (error) {
      res.status(500).json({ message: "Failed to send daily summary" });
    }
  });
  
  // Access Key Management Routes (Admin only)
  app.get("/api/keys", requireAdmin, async (req, res) => {
    try {
      const keys = await storage.getKeys();
      res.json(keys);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch access keys" });
    }
  });
  
  app.post("/api/keys", requireAdmin, async (req, res) => {
    try {
      // Generate a random key if not provided
      if (!req.body.key) {
        req.body.key = crypto.randomBytes(16).toString('hex');
      }
      
      const validatedData = insertAccessKeySchema.parse(req.body);
      const key = await storage.createKey(validatedData);
      res.status(201).json(key);
    } catch (error) {
      if (error instanceof ZodError) {
        const validationError = fromZodError(error);
        return res.status(400).json({ message: validationError.message });
      }
      res.status(500).json({ message: "Failed to create access key" });
    }
  });
  
  app.patch("/api/keys/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid key ID" });
      }
      
      const key = await storage.getKey(id);
      if (!key) {
        return res.status(404).json({ message: "Access key not found" });
      }
      
      // Only allow updating certain fields
      const allowedUpdates = ["label", "isActive", "isAdmin", "expiresAt"];
      const updates: Record<string, any> = {};
      
      for (const field of allowedUpdates) {
        if (req.body[field] !== undefined) {
          updates[field as keyof typeof updates] = req.body[field];
        }
      }
      
      const updatedKey = await storage.updateKey(id, updates);
      res.json(updatedKey);
    } catch (error) {
      res.status(500).json({ message: "Failed to update access key" });
    }
  });
  
  app.delete("/api/keys/:id", requireAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid key ID" });
      }
      
      const key = await storage.getKey(id);
      if (!key) {
        return res.status(404).json({ message: "Access key not found" });
      }
      
      await storage.deleteKey(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete access key" });
    }
  });
  
  // Key validation route (Public)
  app.post("/api/validate-key", async (req, res) => {
    try {
      const { key } = req.body;
      if (!key) {
        return res.status(400).json({ message: "No key provided" });
      }
      
      const keyObj = await storage.getKeyByValue(key);
      if (!keyObj) {
        return res.json({ valid: false, admin: false, message: "Invalid key" });
      }
      
      if (!keyObj.isActive) {
        return res.json({ valid: false, admin: false, message: "Key is inactive" });
      }
      
      if (keyObj.expiresAt && new Date(keyObj.expiresAt) < new Date()) {
        return res.json({ valid: false, admin: false, message: "Key has expired" });
      }
      
      return res.json({ 
        valid: true, 
        admin: keyObj.isAdmin, 
        message: "Valid key",
        label: keyObj.label
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to validate key" });
    }
  });

  // Initialize farming when server starts
  try {
    await initializeTwitchFarming();
  } catch (error) {
    console.error("Failed to initialize Twitch farming:", error);
  }

  const httpServer = createServer(app);
  return httpServer;
}
