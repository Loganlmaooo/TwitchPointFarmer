import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import AddChannelModal from "@/components/add-channel-modal";
import { useChannels, useUpdateChannel, useDeleteChannel } from "@/hooks/use-twitch";
import { Plus, MoreVertical, Trash2, Settings2, StopCircle, PlayCircle } from "lucide-react";
import { TwitchChannel } from "@shared/schema";

export default function Channels() {
  const [addChannelOpen, setAddChannelOpen] = useState(false);
  const { data: channels, isLoading } = useChannels();
  const { mutate: updateChannel } = useUpdateChannel();
  const { mutate: deleteChannel } = useDeleteChannel();

  const formatWatchTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const handleToggleActive = (channel: TwitchChannel) => {
    updateChannel({
      id: channel.id,
      updates: { isActive: !channel.isActive }
    });
  };

  const handleDeleteChannel = (id: number) => {
    if (confirm("Are you sure you want to delete this channel?")) {
      deleteChannel(id);
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case "high":
        return <Badge className="bg-green-600">High</Badge>;
      case "medium":
        return <Badge className="bg-yellow-600">Medium</Badge>;
      case "low":
        return <Badge className="bg-red-600">Low</Badge>;
      default:
        return <Badge className="bg-gray-600">Unknown</Badge>;
    }
  };

  return (
    <div>
      {/* Channels Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Channels</h2>
        <Button 
          variant="default" 
          onClick={() => setAddChannelOpen(true)}
          className="bg-twitch-purple hover:bg-twitch-lightpurple text-white"
        >
          <Plus className="h-4 w-4 mr-1" /> Add Channel
        </Button>
      </div>

      {/* Channels Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <Card key={i} className="bg-twitch-gray border-twitch-lightgray">
              <CardHeader>
                <Skeleton className="h-6 w-40 mb-2 bg-twitch-lightgray" />
                <Skeleton className="h-4 w-24 bg-twitch-lightgray" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full bg-twitch-lightgray" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-full bg-twitch-lightgray" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : channels && channels.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {channels.map((channel) => (
            <Card key={channel.id} className={`bg-twitch-gray border-twitch-lightgray ${!channel.isActive ? 'opacity-70' : ''}`}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="flex items-center">
                    {channel.channelName}
                    {channel.isLive && (
                      <Badge className="ml-2 bg-green-900 text-twitch-success">Live</Badge>
                    )}
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    {getPriorityBadge(channel.priority)} • {formatWatchTime(channel.watchTimeMinutes)} watch time
                  </CardDescription>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-transparent">
                      <MoreVertical className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-twitch-darker border-twitch-lightgray">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-twitch-lightgray" />
                    <DropdownMenuItem
                      className="flex items-center cursor-pointer"
                      onClick={() => handleToggleActive(channel)}
                    >
                      {channel.isActive ? (
                        <>
                          <StopCircle className="mr-2 h-4 w-4 text-twitch-error" /> Stop Farming
                        </>
                      ) : (
                        <>
                          <PlayCircle className="mr-2 h-4 w-4 text-twitch-success" /> Start Farming
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="flex items-center cursor-pointer"
                      onClick={() => {
                        // In a real app, this would open a settings modal
                        alert("Channel settings would open here");
                      }}
                    >
                      <Settings2 className="mr-2 h-4 w-4" /> Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-twitch-lightgray" />
                    <DropdownMenuItem
                      className="flex items-center text-twitch-error cursor-pointer"
                      onClick={() => handleDeleteChannel(channel.id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </CardHeader>
              <CardContent className="py-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Points collected:</span>
                    <span className="font-medium">{channel.pointsCollected.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Bonus claims:</span>
                    <span className="font-medium">{channel.bonusClaims}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-400">Viewers:</span>
                    <span className="font-medium">{channel.isLive ? channel.viewerCount.toLocaleString() : 'Offline'}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t border-twitch-lightgray pt-4">
                <div className="flex justify-between items-center w-full">
                  <span className="text-sm">Active</span>
                  <Switch
                    checked={channel.isActive}
                    onCheckedChange={() => handleToggleActive(channel)}
                    className="data-[state=checked]:bg-twitch-purple"
                  />
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="bg-twitch-gray rounded-lg p-8 text-center">
          <p className="text-gray-400 mb-4">No channels found. Add a channel to start farming points.</p>
          <Button 
            variant="default"
            onClick={() => setAddChannelOpen(true)}
            className="bg-twitch-purple hover:bg-twitch-lightpurple text-white"
          >
            <Plus className="h-4 w-4 mr-1" /> Add Your First Channel
          </Button>
        </div>
      )}

      {/* Add Channel Modal */}
      <AddChannelModal 
        open={addChannelOpen} 
        onOpenChange={setAddChannelOpen} 
      />
    </div>
  );
}
