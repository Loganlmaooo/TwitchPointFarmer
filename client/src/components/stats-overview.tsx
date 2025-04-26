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

  const calculateDaysRunning = (): string => {
    if (!stats?.startDate) return "0 days";
    const days = Math.ceil((Date.now() - new Date(stats.startDate).getTime()) / (1000 * 60 * 60 * 24));
    return `${days} days`;
  };

  const calculateBonusPerDay = (): string => {
    if (!stats?.startDate || !stats.totalBonusClaims) return "0/day";
    const days = Math.max(1, (Date.now() - new Date(stats.startDate).getTime()) / (1000 * 60 * 60 * 24));
    return `~${Math.round(stats.totalBonusClaims / days)}/day`;
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
                {stats?.startDate ? 
                  `Since ${new Date(stats.startDate).toLocaleDateString()}` : 
                  "No data yet"
                }
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
                ~{formatNumber(stats?.pointsPerHour) || "0"}/hour
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
                Running for {calculateDaysRunning()}
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
                {calculateBonusPerDay()}
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
