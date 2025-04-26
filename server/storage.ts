import { 
  TwitchChannel, InsertTwitchChannel, 
  ActivityLog, InsertActivityLog,
  Settings, InsertSettings,
  Stats, InsertStats
} from "@shared/schema";

// Storage interface for database operations
export interface IStorage {
  // TwitchChannel operations
  getChannels(): Promise<TwitchChannel[]>;
  getActiveChannels(): Promise<TwitchChannel[]>;
  getChannel(id: number): Promise<TwitchChannel | undefined>;
  getChannelByName(channelName: string): Promise<TwitchChannel | undefined>;
  createChannel(channel: InsertTwitchChannel): Promise<TwitchChannel>;
  updateChannel(id: number, updates: Partial<TwitchChannel>): Promise<TwitchChannel | undefined>;
  deleteChannel(id: number): Promise<boolean>;

  // ActivityLog operations
  getLogs(limit?: number): Promise<ActivityLog[]>;
  getLogsByChannel(channelId: number, limit?: number): Promise<ActivityLog[]>;
  createLog(log: InsertActivityLog): Promise<ActivityLog>;
  markLogAsSent(id: number): Promise<boolean>;
  getUnsentLogs(): Promise<ActivityLog[]>;

  // Settings operations
  getSettings(): Promise<Settings | undefined>;
  saveSettings(settings: InsertSettings): Promise<Settings>;
  updateSettings(updates: Partial<Settings>): Promise<Settings | undefined>;

  // Stats operations
  getStats(): Promise<Stats | undefined>;
  updateStats(updates: Partial<Stats>): Promise<Stats | undefined>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private channels: Map<number, TwitchChannel>;
  private logs: Map<number, ActivityLog>;
  private settingsObj: Settings | undefined;
  private statsObj: Stats | undefined;
  private channelIdCounter: number;
  private logIdCounter: number;

  constructor() {
    this.channels = new Map();
    this.logs = new Map();
    this.channelIdCounter = 1;
    this.logIdCounter = 1;

    // Initialize with default settings
    this.settingsObj = {
      id: 1,
      twitchUsername: "",
      twitchClientId: "",
      twitchAccessToken: "",
      twitchRefreshToken: "",
      discordWebhookUrl: "https://discord.com/api/webhooks/1365508833815953518/i6QoxKXSD75Yp-F1zmeVEga1K_DKt3J4xAOdMe_TGWXjWPmBkAbhCB9l4dyfoQtC7Yl8",
      maxConcurrentChannels: 5,
      refreshInterval: 60,
      lastUpdated: new Date(),
    };

    // Initialize with default stats
    this.statsObj = {
      id: 1,
      totalPointsCollected: 0,
      totalWatchTimeMinutes: 0,
      totalBonusClaims: 0,
      activeChannels: 0,
      pointsPerHour: 0,
      startDate: new Date(),
      lastUpdated: new Date(),
    };

    // Add some demo channels
    this.seedDemoData();
  }

  private seedDemoData() {
    const demoChannels = [
      {
        channelName: "xQc",
        isLive: true,
        viewerCount: 124700,
        pointsCollected: 18762,
        watchTimeMinutes: 56 * 60 + 42,
        bonusClaims: 42,
        autoClaimPoints: true,
        claimBonuses: true,
        sendLogsToDiscord: true,
        autoFollow: false,
        priority: "medium",
      },
      {
        channelName: "Asmongold",
        isLive: true,
        viewerCount: 53200,
        pointsCollected: 12450,
        watchTimeMinutes: 42 * 60 + 18,
        bonusClaims: 36,
        autoClaimPoints: true,
        claimBonuses: true,
        sendLogsToDiscord: true,
        autoFollow: false,
        priority: "high",
      },
      {
        channelName: "pokimane",
        isLive: true,
        viewerCount: 42300,
        pointsCollected: 8234,
        watchTimeMinutes: 24 * 60 + 15,
        bonusClaims: 22,
        autoClaimPoints: true,
        claimBonuses: true,
        sendLogsToDiscord: true,
        autoFollow: false,
        priority: "medium",
      },
      {
        channelName: "LIRIK",
        isLive: false,
        viewerCount: 0,
        pointsCollected: 3444,
        watchTimeMinutes: 16 * 60 + 30,
        bonusClaims: 18,
        autoClaimPoints: true,
        claimBonuses: true,
        sendLogsToDiscord: true,
        autoFollow: false,
        priority: "low",
      }
    ];

    demoChannels.forEach(channel => {
      const id = this.channelIdCounter++;
      this.channels.set(id, {
        id,
        channelId: `${id}${channel.channelName.toLowerCase()}`,
        isActive: true,
        lastUpdated: new Date(),
        ...channel
      });
    });

    // Update stats based on seeded channels
    if (this.statsObj) {
      this.statsObj.totalPointsCollected = Array.from(this.channels.values()).reduce((sum, channel) => sum + channel.pointsCollected, 0);
      this.statsObj.totalWatchTimeMinutes = Array.from(this.channels.values()).reduce((sum, channel) => sum + channel.watchTimeMinutes, 0);
      this.statsObj.totalBonusClaims = Array.from(this.channels.values()).reduce((sum, channel) => sum + channel.bonusClaims, 0);
      this.statsObj.activeChannels = Array.from(this.channels.values()).filter(channel => channel.isActive).length;
      this.statsObj.pointsPerHour = Math.floor(this.statsObj.totalPointsCollected / (this.statsObj.totalWatchTimeMinutes / 60));
      this.statsObj.startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago
    }

    // Seed some activity logs
    const demoLogs = [
      {
        channelName: "xQc",
        activityType: "points",
        message: "Claimed 250 points from xQc",
        pointsGained: 250,
        timestamp: new Date(Date.now() - 2 * 60 * 1000), // 2 minutes ago
      },
      {
        channelName: "pokimane",
        activityType: "live",
        message: "Channel pokimane went live",
        pointsGained: 0,
        timestamp: new Date(Date.now() - 15 * 60 * 1000), // 15 minutes ago
      },
      {
        channelName: "Asmongold",
        activityType: "points",
        message: "Claimed 150 points from Asmongold",
        pointsGained: 150,
        timestamp: new Date(Date.now() - 26 * 60 * 1000), // 26 minutes ago
      },
      {
        channelName: "xQc",
        activityType: "bonus",
        message: "Claimed bonus points from xQc",
        pointsGained: 500,
        timestamp: new Date(Date.now() - 42 * 60 * 1000), // 42 minutes ago
      },
      {
        channelName: "LIRIK",
        activityType: "error",
        message: "Connection error with LIRIK",
        pointsGained: 0,
        timestamp: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
      },
      {
        channelName: "pokimane",
        activityType: "connection",
        message: "Added channel pokimane to farming",
        pointsGained: 0,
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      }
    ];

    demoLogs.forEach(log => {
      const id = this.logIdCounter++;
      const channelObj = Array.from(this.channels.values()).find(channel => channel.channelName === log.channelName);
      this.logs.set(id, {
        id,
        channelId: channelObj?.id,
        sentToDiscord: true,
        ...log
      });
    });
  }

  // TwitchChannel operations
  async getChannels(): Promise<TwitchChannel[]> {
    return Array.from(this.channels.values());
  }

  async getActiveChannels(): Promise<TwitchChannel[]> {
    return Array.from(this.channels.values()).filter(channel => channel.isActive);
  }

  async getChannel(id: number): Promise<TwitchChannel | undefined> {
    return this.channels.get(id);
  }

  async getChannelByName(channelName: string): Promise<TwitchChannel | undefined> {
    return Array.from(this.channels.values()).find(
      channel => channel.channelName.toLowerCase() === channelName.toLowerCase()
    );
  }

  async createChannel(channel: InsertTwitchChannel): Promise<TwitchChannel> {
    const id = this.channelIdCounter++;
    const newChannel: TwitchChannel = {
      id,
      channelId: "",
      isLive: false,
      viewerCount: 0,
      pointsCollected: 0,
      watchTimeMinutes: 0,
      bonusClaims: 0,
      lastUpdated: new Date(),
      isActive: true,
      ...channel
    };
    this.channels.set(id, newChannel);
    return newChannel;
  }

  async updateChannel(id: number, updates: Partial<TwitchChannel>): Promise<TwitchChannel | undefined> {
    const channel = this.channels.get(id);
    if (!channel) return undefined;

    const updatedChannel = {
      ...channel,
      ...updates,
      lastUpdated: new Date()
    };
    this.channels.set(id, updatedChannel);
    return updatedChannel;
  }

  async deleteChannel(id: number): Promise<boolean> {
    return this.channels.delete(id);
  }

  // ActivityLog operations
  async getLogs(limit = 100): Promise<ActivityLog[]> {
    return Array.from(this.logs.values())
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  async getLogsByChannel(channelId: number, limit = 50): Promise<ActivityLog[]> {
    return Array.from(this.logs.values())
      .filter(log => log.channelId === channelId)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  async createLog(log: InsertActivityLog): Promise<ActivityLog> {
    const id = this.logIdCounter++;
    const newLog: ActivityLog = {
      id,
      timestamp: new Date(),
      ...log
    };
    this.logs.set(id, newLog);
    return newLog;
  }

  async markLogAsSent(id: number): Promise<boolean> {
    const log = this.logs.get(id);
    if (!log) return false;

    const updatedLog = {
      ...log,
      sentToDiscord: true
    };
    this.logs.set(id, updatedLog);
    return true;
  }

  async getUnsentLogs(): Promise<ActivityLog[]> {
    return Array.from(this.logs.values())
      .filter(log => !log.sentToDiscord)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  // Settings operations
  async getSettings(): Promise<Settings | undefined> {
    return this.settingsObj;
  }

  async saveSettings(settings: InsertSettings): Promise<Settings> {
    this.settingsObj = {
      id: 1,
      lastUpdated: new Date(),
      ...settings
    };
    return this.settingsObj;
  }

  async updateSettings(updates: Partial<Settings>): Promise<Settings | undefined> {
    if (!this.settingsObj) return undefined;

    this.settingsObj = {
      ...this.settingsObj,
      ...updates,
      lastUpdated: new Date()
    };
    return this.settingsObj;
  }

  // Stats operations
  async getStats(): Promise<Stats | undefined> {
    return this.statsObj;
  }

  async updateStats(updates: Partial<Stats>): Promise<Stats | undefined> {
    if (!this.statsObj) return undefined;

    this.statsObj = {
      ...this.statsObj,
      ...updates,
      lastUpdated: new Date()
    };
    return this.statsObj;
  }
}

export const storage = new MemStorage();
