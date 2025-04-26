import { 
  TwitchChannel, InsertTwitchChannel, 
  ActivityLog, InsertActivityLog,
  Settings, InsertSettings,
  Stats, InsertStats,
  AccessKey, InsertAccessKey
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
  
  // Access Key operations
  getKeys(): Promise<AccessKey[]>;
  getKey(id: number): Promise<AccessKey | undefined>;
  getKeyByValue(keyValue: string): Promise<AccessKey | undefined>;
  createKey(key: InsertAccessKey): Promise<AccessKey>;
  updateKey(id: number, updates: Partial<AccessKey>): Promise<AccessKey | undefined>;
  deleteKey(id: number): Promise<boolean>;
  validateKey(keyValue: string): Promise<boolean>;
  validateAdminKey(keyValue: string): Promise<boolean>;
}

// In-memory storage implementation
export class MemStorage implements IStorage {
  private channels: Map<number, TwitchChannel>;
  private logs: Map<number, ActivityLog>;
  private settingsObj: Settings | undefined;
  private statsObj: Stats | undefined;
  private keys: Map<number, AccessKey>;
  private channelIdCounter: number;
  private logIdCounter: number;
  private keyIdCounter: number;

  constructor() {
    this.channels = new Map();
    this.logs = new Map();
    this.keys = new Map();
    this.channelIdCounter = 1;
    this.logIdCounter = 1;
    this.keyIdCounter = 1;

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

    // Initialize the storage with empty data
    this.seedDemoData();
  }

  private seedDemoData() {
    // No demo data - all will be added by the user
    
    // Initialize empty stats
    if (this.statsObj) {
      this.statsObj.totalPointsCollected = 0;
      this.statsObj.totalWatchTimeMinutes = 0;
      this.statsObj.totalBonusClaims = 0;
      this.statsObj.activeChannels = 0;
      this.statsObj.pointsPerHour = 0;
      this.statsObj.startDate = new Date();
    }
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
  
  // Access Key operations
  async getKeys(): Promise<AccessKey[]> {
    return Array.from(this.keys.values());
  }

  async getKey(id: number): Promise<AccessKey | undefined> {
    return this.keys.get(id);
  }

  async getKeyByValue(keyValue: string): Promise<AccessKey | undefined> {
    return Array.from(this.keys.values()).find(key => key.key === keyValue);
  }

  async createKey(key: InsertAccessKey): Promise<AccessKey> {
    const id = this.keyIdCounter++;
    const newKey: AccessKey = {
      id,
      createdAt: new Date(),
      ...key
    };
    this.keys.set(id, newKey);
    return newKey;
  }

  async updateKey(id: number, updates: Partial<AccessKey>): Promise<AccessKey | undefined> {
    const key = this.keys.get(id);
    if (!key) return undefined;

    const updatedKey = {
      ...key,
      ...updates
    };
    this.keys.set(id, updatedKey);
    return updatedKey;
  }

  async deleteKey(id: number): Promise<boolean> {
    return this.keys.delete(id);
  }

  async validateKey(keyValue: string): Promise<boolean> {
    const key = await this.getKeyByValue(keyValue);
    return !!(key && key.isActive);
  }

  async validateAdminKey(keyValue: string): Promise<boolean> {
    const key = await this.getKeyByValue(keyValue);
    return !!(key && key.isActive && key.isAdmin);
  }
}

export const storage = new MemStorage();
