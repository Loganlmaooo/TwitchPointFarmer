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
  const { data: stats } = useStats();
  const { refetch: refetchStats } = useStats();

  const handleRefresh = async () => {
    await Promise.all([
      refetch(),
      refetchStats(),
      queryClient.invalidateQueries({ queryKey: ["/api/logs"] })
    ]);
  };

  const hasChannels = channels && channels.length > 0;
  const hasTwitchCredentials = stats && stats.hasAccessToken;

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

      {/* Welcome Message when no channels or credentials */}
      {!isLoading && !hasChannels && (
        <div className="bg-slate-800 rounded-lg shadow-lg p-8 mb-6 border border-slate-700">
          <h3 className="text-xl font-semibold text-white mb-4">Welcome to Twitch Point Farmer</h3>
          
          {!hasTwitchCredentials ? (
            <div className="space-y-4">
              <p className="text-slate-300">
                To get started, you need to set up your Twitch credentials in the Settings page.
              </p>
              <div className="bg-slate-700 p-4 rounded border border-slate-600">
                <h4 className="font-medium text-white mb-2">Required Setup:</h4>
                <ol className="list-decimal list-inside text-slate-300 space-y-2">
                  <li>Go to the <Button variant="link" asChild className="text-twitch-purple p-0"><a href="/settings">Settings page</a></Button></li>
                  <li>Enter your Twitch username, Client ID, and API tokens</li>
                  <li>Return to Dashboard and add channels to start farming</li>
                </ol>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-slate-300">
                Great! Your Twitch credentials are set up. Now you need to add channels to start farming points.
              </p>
              <Button 
                onClick={() => setAddChannelOpen(true)}
                className="bg-twitch-purple hover:bg-twitch-lightpurple text-white"
              >
                <Plus className="h-4 w-4 mr-2" /> Add Your First Channel
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Show regular dashboard content if we have channels */}
      {(hasChannels || isLoading) && (
        <>
          {/* Stats Overview */}
          <StatsOverview activeChannels={channels} isLoading={isLoading} />

          {/* Active Channels */}
          <ActiveChannels channels={channels} isLoading={isLoading} />

          {/* Recent Activity and Discord Logs */}
          <RecentActivity />
        </>
      )}

      {/* Add Channel Modal */}
      <AddChannelModal 
        open={addChannelOpen} 
        onOpenChange={setAddChannelOpen} 
      />
    </div>
  );
}
