import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import {
  getChannels,
  getActiveChannels,
  createChannel,
  updateChannel,
  deleteChannel,
  getLogs,
  getSettings,
  saveSettings,
  updateSettings,
  getStats,
  startFarming,
  stopFarming,
  sendWebhookTest,
  sendDailySummary
} from "@/lib/api";
import { InsertTwitchChannel, TwitchChannel } from "@shared/schema";

export function useTwitchChannels() {
  return useQuery({
    queryKey: ["/api/channels"],
    queryFn: getChannels
  });
}

// Alias for backward compatibility
export const useChannels = useTwitchChannels;

export function useActiveChannels() {
  return useQuery({
    queryKey: ["/api/channels/active"],
    queryFn: getActiveChannels
  });
}

export function useCreateChannel() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (data: InsertTwitchChannel) => createChannel(data),
    onSuccess: () => {
      toast({
        title: "Channel Added",
        description: "The channel has been added successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/channels"] });
      queryClient.invalidateQueries({ queryKey: ["/api/channels/active"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to add channel",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  });
}

export function useUpdateChannel() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: Partial<TwitchChannel> }) => 
      updateChannel(id, updates),
    onSuccess: () => {
      toast({
        title: "Channel Updated",
        description: "The channel has been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/channels"] });
      queryClient.invalidateQueries({ queryKey: ["/api/channels/active"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to update channel",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  });
}

export function useDeleteChannel() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (id: number) => deleteChannel(id),
    onSuccess: () => {
      toast({
        title: "Channel Removed",
        description: "The channel has been removed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/channels"] });
      queryClient.invalidateQueries({ queryKey: ["/api/channels/active"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to remove channel",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  });
}

export function useLogs(limit = 100) {
  return useQuery({
    queryKey: ["/api/logs", limit],
    queryFn: () => getLogs(limit)
  });
}

export function useSettings() {
  return useQuery({
    queryKey: ["/api/settings"],
    queryFn: getSettings
  });
}

export function useSaveSettings() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: saveSettings,
    onSuccess: () => {
      toast({
        title: "Settings Saved",
        description: "Your settings have been saved successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to save settings",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  });
}

export function useUpdateSettings() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: updateSettings,
    onSuccess: () => {
      toast({
        title: "Settings Updated",
        description: "Your settings have been updated successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to update settings",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  });
}

export function useStats() {
  return useQuery({
    queryKey: ["/api/stats"],
    queryFn: getStats
  });
}

export function useStartFarming() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: startFarming,
    onSuccess: () => {
      toast({
        title: "Farming Started",
        description: "Twitch point farming has been started successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/channels/active"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to start farming",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  });
}

export function useStopFarming() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: stopFarming,
    onSuccess: () => {
      toast({
        title: "Farming Stopped",
        description: "Twitch point farming has been stopped.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/channels/active"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to stop farming",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  });
}

export function useSendWebhookTest() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: sendWebhookTest,
    onSuccess: () => {
      toast({
        title: "Test Webhook Sent",
        description: "A test message has been sent to your Discord webhook.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to send test webhook",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  });
}

export function useSendDailySummary() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: sendDailySummary,
    onSuccess: () => {
      toast({
        title: "Daily Summary Sent",
        description: "A daily summary has been sent to your Discord webhook.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to send daily summary",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  });
}

export function useSendPendingWebhooks() {
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: sendPendingWebhooks,
    onSuccess: () => {
      toast({
        title: "Pending Webhooks Sent",
        description: "All pending webhook notifications have been sent to Discord.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/logs"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to send webhooks",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    }
  });
}
