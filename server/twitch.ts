import { storage } from "./storage";
import { sendDiscordWebhook } from "./discord";
import { TwitchChannel, ActivityLog, InsertActivityLog } from "@shared/schema";

// Interval handles for farming processes
let channelCheckInterval: NodeJS.Timeout | null = null;
let pointsClaimInterval: NodeJS.Timeout | null = null;

interface TwitchTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

interface TwitchStreamData {
  id: string;
  user_id: string;
  user_name: string;
  game_id: string;
  game_name: string;
  type: string;
  title: string;
  viewer_count: number;
  started_at: string;
  language: string;
  thumbnail_url: string;
  tag_ids: string[];
}

// Initialize Twitch farming system
export async function initializeTwitchFarming(): Promise<boolean> {
  try {
    const settings = await storage.getSettings();
    if (!settings || !settings.twitchAccessToken) {
      console.log("Twitch access token not set, farming not started");
      return false;
    }

    // Start the farming processes
    startChannelChecks();
    startPointsClaiming();
    return true;
  } catch (error) {
    console.error("Error initializing Twitch farming:", error);
    return false;
  }
}

// Start checking channel status at regular intervals
function startChannelChecks(): void {
  if (channelCheckInterval) {
    clearInterval(channelCheckInterval);
  }

  channelCheckInterval = setInterval(async () => {
    try {
      const settings = await storage.getSettings();
      if (!settings) return;

      const channels = await storage.getActiveChannels();
      await updateChannelStatuses(channels);
    } catch (error) {
      console.error("Error in channel check interval:", error);
    }
  }, 5 * 60 * 1000); // Check every 5 minutes
}

// Start claiming points at regular intervals
function startPointsClaiming(): void {
  if (pointsClaimInterval) {
    clearInterval(pointsClaimInterval);
  }

  pointsClaimInterval = setInterval(async () => {
    try {
      const settings = await storage.getSettings();
      if (!settings) return;

      const channels = await storage.getActiveChannels();
      await claimChannelPoints(channels);
    } catch (error) {
      console.error("Error in points claim interval:", error);
    }
  }, 60 * 1000); // Claim points every minute
}

// Stop all farming processes
export function stopTwitchFarming(): void {
  if (channelCheckInterval) {
    clearInterval(channelCheckInterval);
    channelCheckInterval = null;
  }

  if (pointsClaimInterval) {
    clearInterval(pointsClaimInterval);
    pointsClaimInterval = null;
  }

  console.log("Twitch farming stopped");
}

// Update live status for all active channels
async function updateChannelStatuses(channels: TwitchChannel[]): Promise<void> {
  try {
    const settings = await storage.getSettings();
    if (!settings || !settings.twitchAccessToken || !settings.twitchClientId) {
      return;
    }

    const channelNames = channels.map(channel => channel.channelName).join("&login=");
    
    const response = await fetch(`https://api.twitch.tv/helix/streams?user_login=${channelNames}`, {
      headers: {
        "Client-ID": settings.twitchClientId,
        "Authorization": `Bearer ${settings.twitchAccessToken}`
      }
    });

    // Handle authentication errors
    if (response.status === 401) {
      await refreshTwitchToken();
      return;
    }

    if (!response.ok) {
      throw new Error(`Twitch API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const liveStreams: TwitchStreamData[] = data.data || [];
    
    // Update channel status based on API response
    for (const channel of channels) {
      const streamData = liveStreams.find(stream => 
        stream.user_name.toLowerCase() === channel.channelName.toLowerCase()
      );
      
      const wasLive = channel.isLive;
      const isLiveNow = !!streamData;
      
      if (wasLive !== isLiveNow) {
        // Status changed, update and log
        await storage.updateChannel(channel.id, { 
          isLive: isLiveNow,
          viewerCount: isLiveNow ? streamData.viewer_count : 0 
        });
        
        // Create activity log
        const logEntry: InsertActivityLog = {
          channelId: channel.id,
          channelName: channel.channelName,
          activityType: isLiveNow ? "live" : "offline",
          message: isLiveNow 
            ? `Channel ${channel.channelName} went live`
            : `Channel ${channel.channelName} went offline`,
          pointsGained: 0,
          sentToDiscord: false
        };
        
        const log = await storage.createLog(logEntry);
        if (channel.sendLogsToDiscord) {
          await sendDiscordWebhook(log);
        }
      } else if (isLiveNow && streamData.viewer_count !== channel.viewerCount) {
        // Just update viewer count if it changed
        await storage.updateChannel(channel.id, { 
          viewerCount: streamData.viewer_count 
        });
      }
    }
    
    // Update global stats
    const stats = await storage.getStats();
    if (stats) {
      const activeChannels = channels.filter(c => c.isLive).length;
      await storage.updateStats({ activeChannels });
    }
  } catch (error) {
    console.error("Error updating channel statuses:", error);
    await logError("Failed to update channel statuses", undefined, error);
  }
}

// Claim channel points for all active live channels
async function claimChannelPoints(channels: TwitchChannel[]): Promise<void> {
  try {
    const liveChannels = channels.filter(channel => channel.isLive);
    
    for (const channel of liveChannels) {
      if (!channel.autoClaimPoints) continue;
      
      // In a real implementation, this would connect to Twitch's websocket to detect point availability
      // For this simulation, we'll randomly add points at intervals
      if (Math.random() < 0.3) { // 30% chance of points being available each check
        const pointsGained = Math.floor(Math.random() * 100) + 50; // 50-150 points
        
        // Update channel stats
        const updatedChannel = await storage.updateChannel(channel.id, {
          pointsCollected: channel.pointsCollected + pointsGained,
          watchTimeMinutes: channel.watchTimeMinutes + 1 // 1 minute since last check
        });
        
        if (!updatedChannel) continue;
        
        // Log the points claim
        const logEntry: InsertActivityLog = {
          channelId: channel.id,
          channelName: channel.channelName,
          activityType: "points",
          message: `Claimed ${pointsGained} points from ${channel.channelName}`,
          pointsGained,
          sentToDiscord: false
        };
        
        const log = await storage.createLog(logEntry);
        if (channel.sendLogsToDiscord) {
          await sendDiscordWebhook(log);
        }
        
        // Update global stats
        const stats = await storage.getStats();
        if (stats) {
          await storage.updateStats({
            totalPointsCollected: stats.totalPointsCollected + pointsGained,
            totalWatchTimeMinutes: stats.totalWatchTimeMinutes + 1,
            pointsPerHour: Math.floor((stats.totalPointsCollected + pointsGained) / ((stats.totalWatchTimeMinutes + 1) / 60))
          });
        }
      }
      
      // Chance for bonus points if enabled
      if (channel.claimBonuses && Math.random() < 0.05) { // 5% chance of bonus
        const bonusPoints = Math.floor(Math.random() * 400) + 100; // 100-500 bonus points
        
        // Update channel stats
        const updatedChannel = await storage.updateChannel(channel.id, {
          pointsCollected: channel.pointsCollected + bonusPoints,
          bonusClaims: channel.bonusClaims + 1
        });
        
        if (!updatedChannel) continue;
        
        // Log the bonus claim
        const logEntry: InsertActivityLog = {
          channelId: channel.id,
          channelName: channel.channelName,
          activityType: "bonus",
          message: `Claimed ${bonusPoints} bonus points from ${channel.channelName}`,
          pointsGained: bonusPoints,
          sentToDiscord: false
        };
        
        const log = await storage.createLog(logEntry);
        if (channel.sendLogsToDiscord) {
          await sendDiscordWebhook(log);
        }
        
        // Update global stats
        const stats = await storage.getStats();
        if (stats) {
          await storage.updateStats({
            totalPointsCollected: stats.totalPointsCollected + bonusPoints,
            totalBonusClaims: stats.totalBonusClaims + 1
          });
        }
      }
    }
  } catch (error) {
    console.error("Error claiming channel points:", error);
    await logError("Failed to claim channel points", undefined, error);
  }
}

// Refresh Twitch API token
async function refreshTwitchToken(): Promise<boolean> {
  try {
    const settings = await storage.getSettings();
    if (!settings || !settings.twitchClientId || !settings.twitchRefreshToken) {
      return false;
    }

    const response = await fetch('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: settings.twitchClientId,
        client_secret: process.env.TWITCH_CLIENT_SECRET || '',
        grant_type: 'refresh_token',
        refresh_token: settings.twitchRefreshToken,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to refresh token: ${response.status} ${response.statusText}`);
    }

    const data: TwitchTokenResponse = await response.json();
    
    await storage.updateSettings({
      twitchAccessToken: data.access_token,
      twitchRefreshToken: data.refresh_token,
    });

    return true;
  } catch (error) {
    console.error("Error refreshing Twitch token:", error);
    await logError("Failed to refresh Twitch API token", undefined, error);
    return false;
  }
}

// Log error to storage
async function logError(message: string, channelName: string | undefined, error: unknown): Promise<void> {
  try {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const logEntry: InsertActivityLog = {
      channelId: undefined,
      channelName,
      activityType: "error",
      message: `${message}: ${errorMessage}`,
      pointsGained: 0,
      sentToDiscord: false
    };
    
    const log = await storage.createLog(logEntry);
    await sendDiscordWebhook(log);
  } catch (e) {
    console.error("Failed to log error:", e);
  }
}
