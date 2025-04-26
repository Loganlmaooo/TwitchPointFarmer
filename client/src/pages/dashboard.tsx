import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import StatsOverview from "@/components/stats-overview";
import ActiveChannels from "@/components/active-channels";
import RecentActivity from "@/components/recent-activity";
import AddChannelModal from "@/components/add-channel-modal";
import { useActiveChannels, useStats } from "@/hooks/use-twitch";
import { RefreshCw, Plus } from "lucide-react";
import { queryClient } from "@/lib/queryClient";

export default function Dashboard() {
  const [addChannelOpen, setAddChannelOpen] = useState(false);
  const { data: channels, isLoading, refetch } = useActiveChannels();
  const { refetch: refetchStats } = useStats();

  const handleRefresh = async () => {
    await Promise.all([
      refetch(),
      refetchStats(),
      queryClient.invalidateQueries({ queryKey: ["/api/logs"] })
    ]);
  };

  return (
    <div>
      {/* Dashboard Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Dashboard</h2>
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
            onClick={() => setAddChannelOpen(true)}
            className="bg-twitch-purple hover:bg-twitch-lightpurple text-white"
          >
            <Plus className="h-4 w-4 mr-1" /> Add Channel
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <StatsOverview activeChannels={channels} isLoading={isLoading} />

      {/* Active Channels */}
      <ActiveChannels channels={channels} isLoading={isLoading} />

      {/* Recent Activity and Discord Logs */}
      <RecentActivity />

      {/* Add Channel Modal */}
      <AddChannelModal 
        open={addChannelOpen} 
        onOpenChange={setAddChannelOpen} 
      />
    </div>
  );
}
