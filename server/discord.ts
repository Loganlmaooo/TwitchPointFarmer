import { storage } from "./storage";
import { ActivityLog } from "@shared/schema";

interface DiscordWebhookPayload {
  content?: string;
  username?: string;
  avatar_url?: string;
  embeds?: DiscordEmbed[];
}

interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: number;
  timestamp?: string;
  fields?: { name: string; value: string; inline?: boolean }[];
  footer?: { text: string; icon_url?: string };
}

export async function sendDiscordWebhook(log: ActivityLog): Promise<boolean> {
  try {
    const settings = await storage.getSettings();
    if (!settings || !settings.discordWebhookUrl) {
      console.error("Discord webhook URL not configured");
      return false;
    }

    const webhookUrl = settings.discordWebhookUrl;
    const payload = formatLogForDiscord(log);

    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to send Discord webhook: ${response.status} ${errorText}`);
      return false;
    }

    await storage.markLogAsSent(log.id);
    return true;
  } catch (error) {
    console.error("Error sending Discord webhook:", error);
    return false;
  }
}

function formatLogForDiscord(log: ActivityLog): DiscordWebhookPayload {
  const colors = {
    points: 11370315, // Purple
    bonus: 16766720, // Yellow/Gold
    live: 5763719, // Green
    offline: 9807270, // Gray
    error: 15548997, // Red
    connection: 3447003, // Blue
  };

  const typeIcons = {
    points: "💰",
    bonus: "🎁",
    live: "🔴",
    offline: "⚫",
    error: "⚠️",
    connection: "🔌",
  };

  const activityType = log.activityType as keyof typeof colors;
  const color = colors[activityType] || colors.connection;
  const icon = typeIcons[activityType] || "📝";

  const embed: DiscordEmbed = {
    title: `${icon} Twitch Point Farmer - ${log.channelName || "System"}`,
    description: log.message,
    color,
    timestamp: log.timestamp.toISOString(),
    fields: [],
  };

  if (log.pointsGained > 0) {
    embed.fields?.push({
      name: "Points Gained",
      value: log.pointsGained.toString(),
      inline: true,
    });
  }

  if (log.channelName) {
    embed.fields?.push({
      name: "Channel",
      value: log.channelName,
      inline: true,
    });
  }

  return {
    username: "Twitch Point Farmer",
    avatar_url: "https://static.twitchcdn.net/assets/favicon-32-d6025c14e900565d6177.png",
    embeds: [embed],
  };
}

export async function sendPendingWebhooks(): Promise<void> {
  const unsentLogs = await storage.getUnsentLogs();
  for (const log of unsentLogs) {
    await sendDiscordWebhook(log);
  }
}

export async function sendDailySummary(): Promise<boolean> {
  try {
    const stats = await storage.getStats();
    if (!stats) return false;

    const settings = await storage.getSettings();
    if (!settings || !settings.discordWebhookUrl) return false;

    const channels = await storage.getActiveChannels();
    const channelCount = channels.length;

    const formatTime = (minutes: number): string => {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours}h ${mins}m`;
    };

    const payload: DiscordWebhookPayload = {
      username: "Twitch Point Farmer",
      avatar_url: "https://static.twitchcdn.net/assets/favicon-32-d6025c14e900565d6177.png",
      embeds: [
        {
          title: "📊 Daily Summary Report",
          color: 11370315, // Purple
          timestamp: new Date().toISOString(),
          fields: [
            {
              name: "Active Channels",
              value: channelCount.toString(),
              inline: true,
            },
            {
              name: "Total Points",
              value: stats.totalPointsCollected.toString(),
              inline: true,
            },
            {
              name: "Points Per Hour",
              value: stats.pointsPerHour.toString(),
              inline: true,
            },
            {
              name: "Total Watch Time",
              value: formatTime(stats.totalWatchTimeMinutes),
              inline: true,
            },
            {
              name: "Bonus Claims",
              value: stats.totalBonusClaims.toString(),
              inline: true,
            },
            {
              name: "Running Since",
              value: stats.startDate.toLocaleDateString(),
              inline: true,
            },
          ],
          footer: {
            text: "Twitch Point Farmer - Daily Summary",
          },
        },
      ],
    };

    const response = await fetch(settings.discordWebhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to send daily summary: ${response.status} ${errorText}`);
      return false;
    }

    // Create a log entry for the daily summary
    await storage.createLog({
      channelId: undefined,
      channelName: undefined,
      activityType: "connection",
      message: `Daily summary sent (${channelCount} channels, ${stats.totalPointsCollected} points)`,
      pointsGained: 0,
      sentToDiscord: true,
    });

    return true;
  } catch (error) {
    console.error("Error sending daily summary:", error);
    return false;
  }
}
