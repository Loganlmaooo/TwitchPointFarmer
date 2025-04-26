import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useStats } from "@/hooks/use-twitch";
import { TwitchChannel } from "@shared/schema";
import { Tv2, Coins, Clock, Gift } from "lucide-react";

interface StatsOverviewProps {
  activeChannels?: TwitchChannel[];
  isLoading?: boolean;
}

export default function StatsOverview({ activeChannels, isLoading }: StatsOverviewProps) {
  const { data: stats, isLoading: isStatsLoading } = useStats();
  
  const formatWatchTime = (minutes?: number): string => {
    if (!minutes) return "0h 0m";
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };
  
  const formatNumber = (num?: number): string => {
    if (!num) return "0";
    return num.toLocaleString();
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Active Channels Card */}
      <Card className="bg-twitch-gray border-0">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-400 text-sm">Active Channels</h3>
            <Tv2 className="text-twitch-purple h-5 w-5" />
          </div>
          {isLoading ? (
            <Skeleton className="h-8 w-20 bg-twitch-lightgray" />
          ) : (
            <>
              <p className="text-2xl font-semibold">{activeChannels?.filter(c => c.isLive).length || 0}</p>
              <p className="text-xs text-gray-400 mt-1">
                {stats?.startDate && `Since ${new Date(stats.startDate).toLocaleDateString()}`}
              </p>
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Points Collected Card */}
      <Card className="bg-twitch-gray border-0">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-400 text-sm">Points Collected</h3>
            <Coins className="text-twitch-warning h-5 w-5" />
          </div>
          {isStatsLoading ? (
            <Skeleton className="h-8 w-28 bg-twitch-lightgray" />
          ) : (
            <>
              <p className="text-2xl font-semibold">{formatNumber(stats?.totalPointsCollected)}</p>
              <p className="text-xs text-gray-400 mt-1">
                ~{formatNumber(stats?.pointsPerHour)}/hour
              </p>
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Watch Time Card */}
      <Card className="bg-twitch-gray border-0">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-400 text-sm">Watch Time</h3>
            <Clock className="text-twitch-success h-5 w-5" />
          </div>
          {isStatsLoading ? (
            <Skeleton className="h-8 w-24 bg-twitch-lightgray" />
          ) : (
            <>
              <p className="text-2xl font-semibold">{formatWatchTime(stats?.totalWatchTimeMinutes)}</p>
              <p className="text-xs text-gray-400 mt-1">
                {stats?.startDate && `Running for ${Math.ceil((Date.now() - new Date(stats.startDate).getTime()) / (1000 * 60 * 60 * 24))} days`}
              </p>
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Bonus Claims Card */}
      <Card className="bg-twitch-gray border-0">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-gray-400 text-sm">Bonus Claims</h3>
            <Gift className="text-twitch-lightpurple h-5 w-5" />
          </div>
          {isStatsLoading ? (
            <Skeleton className="h-8 w-16 bg-twitch-lightgray" />
          ) : (
            <>
              <p className="text-2xl font-semibold">{formatNumber(stats?.totalBonusClaims)}</p>
              <p className="text-xs text-gray-400 mt-1">
                {stats?.startDate && 
                  `~${Math.round(
                    (stats.totalBonusClaims || 0) / 
                    (Math.max(1, (Date.now() - new Date(stats.startDate).getTime()) / (1000 * 60 * 60 * 24)))
                  )}/day`
                }
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
