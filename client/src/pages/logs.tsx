import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLogs, useTwitchChannels, useSendPendingWebhooks } from "@/hooks/use-twitch";
import { RefreshCw, Send, Filter, Search, Coins, Tv2, AlertCircle, Gift, UserPlus, Clock } from "lucide-react";
import { queryClient } from "@/lib/queryClient";
import { ActivityLog } from "@shared/schema";

export default function Logs() {
  const [filter, setFilter] = useState<string>("all");
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const { data: logs, isLoading, refetch } = useLogs(100);
  const { data: channels, isLoading: isChannelsLoading } = useTwitchChannels();
  const { mutate: sendPendingWebhooks, isPending: isSendingWebhooks } = useSendPendingWebhooks();

  const handleRefresh = async () => {
    await refetch();
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'points':
        return <Coins className="text-twitch-warning h-5 w-5" />;
      case 'live':
        return <Tv2 className="text-twitch-purple h-5 w-5" />;
      case 'offline':
        return <Clock className="text-gray-400 h-5 w-5" />;
      case 'error':
        return <AlertCircle className="text-twitch-error h-5 w-5" />;
      case 'bonus':
        return <Gift className="text-twitch-warning h-5 w-5" />;
      case 'connection':
        return <UserPlus className="text-twitch-purple h-5 w-5" />;
      default:
        return <Clock className="text-gray-400 h-5 w-5" />;
    }
  };

  const getActivityBorderColor = (type: string) => {
    switch (type) {
      case 'points':
      case 'offline':
        return 'border-twitch-success';
      case 'live':
      case 'connection':
        return 'border-twitch-purple';
      case 'error':
        return 'border-twitch-error';
      case 'bonus':
        return 'border-twitch-warning';
      default:
        return 'border-gray-400';
    }
  };

  const formatTimestamp = (timestamp: string | Date): string => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).replace(',', '');
  };

  // Filter logs based on type, channel, and search query
  const filteredLogs = logs?.filter((log: ActivityLog) => {
    // Filter by activity type
    if (filter !== "all" && log.activityType !== filter) {
      return false;
    }
    
    // Filter by channel
    if (channelFilter !== "all" && log.channelName !== channelFilter) {
      return false;
    }
    
    // Filter by search query
    if (searchQuery && !log.message.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    return true;
  }) || [];

  // Filter for only Discord webhook logs (sent to Discord)
  const discordLogs = logs?.filter(log => log.sentToDiscord) || [];

  // Filter Discord logs based on filter and search
  const filteredDiscordLogs = discordLogs.filter((log: ActivityLog) => {
    // Filter by activity type
    if (filter !== "all" && log.activityType !== filter) {
      return false;
    }
    
    // Filter by channel
    if (channelFilter !== "all" && log.channelName !== channelFilter) {
      return false;
    }
    
    // Filter by search query
    if (searchQuery && !log.message.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  return (
    <div>
      {/* Logs Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Activity Logs</h2>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            className="bg-twitch-lightgray hover:bg-twitch-gray border-0 text-white"
          >
            <RefreshCw className="h-4 w-4 mr-1" /> Refresh
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={() => sendPendingWebhooks()}
            disabled={isSendingWebhooks}
            className="bg-twitch-purple hover:bg-twitch-lightpurple text-white"
          >
            <Send className="h-4 w-4 mr-1" /> Send Pending Webhooks
          </Button>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <Select
            value={filter}
            onValueChange={setFilter}
          >
            <SelectTrigger className="bg-twitch-darker border-twitch-lightgray focus:ring-twitch-purple">
              <SelectValue placeholder="Filter by type" />
            </SelectTrigger>
            <SelectContent className="bg-twitch-darker border-twitch-lightgray">
              <SelectItem value="all">All Activities</SelectItem>
              <SelectItem value="points">Points Claimed</SelectItem>
              <SelectItem value="bonus">Bonus Points</SelectItem>
              <SelectItem value="live">Channel Live</SelectItem>
              <SelectItem value="offline">Channel Offline</SelectItem>
              <SelectItem value="error">Errors</SelectItem>
              <SelectItem value="connection">Connections</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Tv2 className="h-4 w-4 text-gray-400" />
          <Select
            value={channelFilter}
            onValueChange={setChannelFilter}
            disabled={isChannelsLoading}
          >
            <SelectTrigger className="bg-twitch-darker border-twitch-lightgray focus:ring-twitch-purple">
              <SelectValue placeholder="Filter by channel" />
            </SelectTrigger>
            <SelectContent className="bg-twitch-darker border-twitch-lightgray">
              <SelectItem value="all">All Channels</SelectItem>
              {channels?.map(channel => (
                <SelectItem key={channel.id} value={channel.channelName}>
                  {channel.channelName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="relative">
          <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-twitch-darker border-twitch-lightgray focus-visible:ring-twitch-purple pl-10"
          />
        </div>
      </div>

      {/* Logs Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="bg-twitch-lightgray mb-4">
          <TabsTrigger value="all" className="data-[state=active]:bg-twitch-purple data-[state=active]:text-white">
            All Logs
          </TabsTrigger>
          <TabsTrigger value="discord" className="data-[state=active]:bg-twitch-purple data-[state=active]:text-white">
            Discord Webhooks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-0">
          <Card className="bg-twitch-gray border-0">
            <CardHeader>
              <CardTitle>Activity Log</CardTitle>
            </CardHeader>
            <CardContent className="h-[600px] overflow-y-auto">
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-start">
                      <Skeleton className="h-6 w-6 mr-3 rounded-full bg-twitch-lightgray" />
                      <div className="w-full">
                        <Skeleton className="h-4 w-full mb-1 bg-twitch-lightgray" />
                        <Skeleton className="h-3 w-20 bg-twitch-lightgray" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredLogs.length > 0 ? (
                <div className="space-y-3">
                  {filteredLogs.map((log) => (
                    <div
                      key={log.id}
                      className={`flex items-start p-3 bg-twitch-darker rounded-md border-l-2 ${getActivityBorderColor(log.activityType)}`}
                    >
                      <div className="flex-shrink-0 pt-0.5 mr-3">
                        {getActivityIcon(log.activityType)}
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <p className="text-sm">{log.message}</p>
                          <span className="text-xs text-gray-400">{formatTimestamp(log.timestamp)}</span>
                        </div>
                        <div className="flex mt-1">
                          {log.channelName && (
                            <span className="text-xs text-twitch-purple mr-3">
                              Channel: {log.channelName}
                            </span>
                          )}
                          {log.pointsGained > 0 && (
                            <span className="text-xs text-twitch-warning">
                              +{log.pointsGained} points
                            </span>
                          )}
                          {log.sentToDiscord && (
                            <span className="ml-auto text-xs text-twitch-success flex items-center">
                              <Send className="h-3 w-3 mr-1" /> Sent to Discord
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <p>No logs matching your filters</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="discord" className="mt-0">
          <Card className="bg-twitch-gray border-0">
            <CardHeader>
              <CardTitle>Discord Webhook Logs</CardTitle>
            </CardHeader>
            <CardContent className="h-[600px] overflow-y-auto">
              {isLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="p-2 bg-twitch-darker rounded">
                      <Skeleton className="h-4 w-40 mb-1 bg-twitch-lightgray" />
                      <Skeleton className="h-4 w-full bg-twitch-lightgray" />
                    </div>
                  ))}
                </div>
              ) : filteredDiscordLogs.length > 0 ? (
                <div className="font-mono text-xs space-y-2">
                  {filteredDiscordLogs.map((log) => (
                    <div
                      key={log.id}
                      className={`p-3 bg-twitch-darker rounded-md border-l-2 ${getActivityBorderColor(log.activityType)}`}
                    >
                      <div className="text-gray-400">[{formatTimestamp(log.timestamp)}]</div>
                      <div className="mt-1">Sent webhook: {log.message}</div>
                      {(log.channelName || log.pointsGained > 0) && (
                        <div className="mt-1 text-gray-400">
                          {log.channelName && (
                            <span className="mr-3">
                              Channel: {log.channelName}
                            </span>
                          )}
                          {log.pointsGained > 0 && (
                            <span>
                              Points: +{log.pointsGained}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  <p>No webhook logs matching your filters</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
