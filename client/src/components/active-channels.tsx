import { useState } from "react";
import { TwitchChannel } from "@shared/schema";
import { useUpdateChannel, useDeleteChannel } from "@/hooks/use-twitch";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { StopCircle, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ActiveChannelsProps {
  channels?: TwitchChannel[];
  isLoading?: boolean;
}

export default function ActiveChannels({ channels = [], isLoading }: ActiveChannelsProps) {
  const [deleteChannelId, setDeleteChannelId] = useState<number | null>(null);
  const { mutate: updateChannel } = useUpdateChannel();
  const { mutate: deleteChannel, isPending: isDeleting } = useDeleteChannel();

  const handleStopChannel = (channelId: number) => {
    updateChannel({ 
      id: channelId, 
      updates: { isActive: false } 
    });
  };

  const handleDeleteChannel = () => {
    if (deleteChannelId !== null) {
      deleteChannel(deleteChannelId);
      setDeleteChannelId(null);
    }
  };

  const formatWatchTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatDate = (date: Date): string => {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    
    const month = date.toLocaleString('default', { month: 'short' });
    return `Since ${month} ${date.getDate()}`;
  };

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-3">Active Channels</h3>
      <div className="bg-twitch-gray rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-8 flex flex-col items-center">
              <Skeleton className="h-12 w-full mb-4 bg-twitch-lightgray" />
              <Skeleton className="h-12 w-full mb-4 bg-twitch-lightgray" />
              <Skeleton className="h-12 w-full mb-4 bg-twitch-lightgray" />
            </div>
          ) : channels.length === 0 ? (
            <div className="py-8 text-center text-gray-400">
              <p>No active channels found. Add a channel to start farming points.</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-twitch-lightgray">
                <TableRow>
                  <TableHead className="text-gray-400">Channel</TableHead>
                  <TableHead className="text-gray-400">Status</TableHead>
                  <TableHead className="text-gray-400">Points</TableHead>
                  <TableHead className="text-gray-400">Watch Time</TableHead>
                  <TableHead className="text-gray-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-twitch-lightgray">
                {channels.map((channel) => (
                  <TableRow key={channel.id}>
                    <TableCell className="py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-twitch-lightgray flex items-center justify-center mr-3">
                          <span className="text-xs uppercase font-bold">
                            {channel.channelName.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm font-medium">{channel.channelName}</div>
                          <div className="text-xs text-gray-400">
                            {channel.viewerCount > 0 ? `${channel.viewerCount.toLocaleString()} viewers` : 'Offline'}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge
                        variant="outline"
                        className={`${
                          channel.isLive
                            ? "bg-green-900 text-twitch-success"
                            : "bg-twitch-lightgray text-gray-400"
                        }`}
                      >
                        {channel.isLive ? "Live" : "Offline"}
                      </Badge>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="font-medium">{channel.pointsCollected.toLocaleString()}</div>
                      <div className="text-xs text-gray-400">
                        {channel.lastUpdated && `Last updated ${new Date(channel.lastUpdated).toLocaleString()}`}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="font-medium">{formatWatchTime(channel.watchTimeMinutes)}</div>
                      <div className="text-xs text-gray-400">
                        {formatDate(new Date(Date.now() - channel.watchTimeMinutes * 60 * 1000))}
                      </div>
                    </TableCell>
                    <TableCell className="whitespace-nowrap">
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleStopChannel(channel.id)}
                          className="text-twitch-error hover:text-red-300 hover:bg-transparent"
                        >
                          <StopCircle className="h-5 w-5" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => setDeleteChannelId(channel.id)}
                          className="text-gray-400 hover:text-white hover:bg-transparent"
                        >
                          <Settings className="h-5 w-5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      <AlertDialog open={deleteChannelId !== null} onOpenChange={(open) => !open && setDeleteChannelId(null)}>
        <AlertDialogContent className="bg-twitch-gray border-twitch-lightgray">
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Channel</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this channel? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-twitch-darker hover:bg-twitch-lightgray border-0">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteChannel}
              disabled={isDeleting}
              className="bg-twitch-purple hover:bg-twitch-lightpurple"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
