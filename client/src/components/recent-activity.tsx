import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useLogs } from "@/hooks/use-twitch";
import { ActivityLog } from "@shared/schema";
import { Coins, Tv2, AlertCircle, Gift, UserPlus, Clock } from "lucide-react";

export default function RecentActivity() {
  const { data: logs, isLoading } = useLogs(20);

  const formatTime = (timestamp: string | Date): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  };

  const formatTimestamp = (timestamp: string | Date): string => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).replace(',', '');
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

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <h3 className="text-lg font-semibold mb-3">Recent Activity</h3>
        <Card className="bg-twitch-gray border-0 h-80 overflow-hidden">
          <CardContent className="p-4 h-full overflow-auto">
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
            ) : logs && logs.length > 0 ? (
              <div className="space-y-3">
                {logs.map((log) => (
                  <div 
                    key={log.id} 
                    className={`flex items-start p-2 border-l-2 ${getActivityBorderColor(log.activityType)}`}
                  >
                    <div className="flex-shrink-0 pt-0.5">
                      {getActivityIcon(log.activityType)}
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm">{log.message}</p>
                      <p className="text-xs text-gray-400">{formatTime(log.timestamp)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <p>No activity logs found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-3">Discord Webhook Logs</h3>
        <Card className="bg-twitch-gray border-0 h-80 overflow-hidden">
          <CardContent className="p-4 h-full overflow-auto">
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="p-2 bg-twitch-darker rounded">
                    <Skeleton className="h-4 w-40 mb-1 bg-twitch-lightgray" />
                    <Skeleton className="h-4 w-full bg-twitch-lightgray" />
                  </div>
                ))}
              </div>
            ) : logs && logs.length > 0 ? (
              <div className="font-mono text-xs space-y-2">
                {logs
                  .filter(log => log.sentToDiscord)
                  .map((log) => (
                    <div 
                      key={log.id} 
                      className={`p-2 bg-twitch-darker rounded border-l-2 ${getActivityBorderColor(log.activityType)}`}
                    >
                      <div className="text-gray-400">[{formatTimestamp(log.timestamp)}]</div>
                      <div>Sent webhook: {log.message}</div>
                    </div>
                  ))}
                {logs.filter(log => log.sentToDiscord).length === 0 && (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <p>No webhook logs found</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <p>No webhook logs found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
