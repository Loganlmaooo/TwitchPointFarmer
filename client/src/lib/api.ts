import { apiRequest } from "./queryClient";
import { TwitchChannel, InsertTwitchChannel, ActivityLog, Settings, Stats } from "@shared/schema";

// Channel API
export async function getChannels(): Promise<TwitchChannel[]> {
  const response = await fetch("/api/channels");
  if (!response.ok) {
    throw new Error("Failed to fetch channels");
  }
  return response.json();
}

export async function getActiveChannels(): Promise<TwitchChannel[]> {
  const response = await fetch("/api/channels/active");
  if (!response.ok) {
    throw new Error("Failed to fetch active channels");
  }
  return response.json();
}

export async function getChannel(id: number): Promise<TwitchChannel> {
  const response = await fetch(`/api/channels/${id}`);
  if (!response.ok) {
    throw new Error("Failed to fetch channel");
  }
  return response.json();
}

export async function createChannel(channel: InsertTwitchChannel): Promise<TwitchChannel> {
  const response = await apiRequest("POST", "/api/channels", channel);
  return response.json();
}

export async function updateChannel(id: number, updates: Partial<TwitchChannel>): Promise<TwitchChannel> {
  const response = await apiRequest("PATCH", `/api/channels/${id}`, updates);
  return response.json();
}

export async function deleteChannel(id: number): Promise<{ success: boolean }> {
  const response = await apiRequest("DELETE", `/api/channels/${id}`);
  return response.json();
}

// Logs API
export async function getLogs(limit = 100): Promise<ActivityLog[]> {
  const response = await fetch(`/api/logs?limit=${limit}`);
  if (!response.ok) {
    throw new Error("Failed to fetch logs");
  }
  return response.json();
}

export async function getChannelLogs(channelId: number, limit = 50): Promise<ActivityLog[]> {
  const response = await fetch(`/api/logs/channel/${channelId}?limit=${limit}`);
  if (!response.ok) {
    throw new Error("Failed to fetch channel logs");
  }
  return response.json();
}

// Settings API
export interface SafeSettings extends Omit<Settings, 'twitchAccessToken' | 'twitchRefreshToken'> {
  hasAccessToken: boolean;
  hasRefreshToken: boolean;
}

export async function getSettings(): Promise<SafeSettings | null> {
  const response = await fetch("/api/settings");
  if (!response.ok) {
    throw new Error("Failed to fetch settings");
  }
  return response.json();
}

export async function saveSettings(settings: Partial<Settings>): Promise<SafeSettings> {
  const response = await apiRequest("POST", "/api/settings", settings);
  return response.json();
}

export async function updateSettings(updates: Partial<Settings>): Promise<SafeSettings> {
  const response = await apiRequest("PATCH", "/api/settings", updates);
  return response.json();
}

// Stats API
export async function getStats(): Promise<Stats | null> {
  const response = await fetch("/api/stats");
  if (!response.ok) {
    throw new Error("Failed to fetch stats");
  }
  return response.json();
}

// Control API
export async function startFarming(): Promise<{ message: string }> {
  const response = await apiRequest("POST", "/api/control/start");
  return response.json();
}

export async function stopFarming(): Promise<{ message: string }> {
  const response = await apiRequest("POST", "/api/control/stop");
  return response.json();
}

export async function sendWebhookTest(): Promise<{ message: string }> {
  const response = await apiRequest("POST", "/api/control/send-webhook-test");
  return response.json();
}

export async function sendPendingWebhooks(): Promise<{ message: string }> {
  const response = await apiRequest("POST", "/api/control/send-pending-webhooks");
  return response.json();
}

export async function sendDailySummary(): Promise<{ message: string }> {
  const response = await apiRequest("POST", "/api/control/send-daily-summary");
  return response.json();
}
