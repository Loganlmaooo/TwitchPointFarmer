import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useStopFarming } from "@/hooks/use-twitch";
import { Menu, X, Twitch, StopCircle, Settings } from "lucide-react";

interface HeaderProps {
  toggleSidebar: () => void;
}

export default function Header({ toggleSidebar }: HeaderProps) {
  const [isConnected, setIsConnected] = useState(true);
  const { mutate: stopAllFarming, isPending } = useStopFarming();

  const handleToggleAllFarming = () => {
    stopAllFarming();
  };

  return (
    <header className="bg-twitch-darker border-b border-twitch-lightgray p-4 flex justify-between items-center">
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden mr-2"
          onClick={toggleSidebar}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <Twitch className="text-twitch-purple h-6 w-6 mr-3" />
        <h1 className="text-xl font-bold">Twitch Point Farmer</h1>
      </div>
      <div className="flex items-center space-x-4">
        {/* Connection Status */}
        <div className="flex items-center">
          <span className="flex h-3 w-3 relative mr-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isConnected ? 'bg-twitch-success' : 'bg-twitch-error'} opacity-75`}></span>
            <span className={`relative inline-flex rounded-full h-3 w-3 ${isConnected ? 'bg-twitch-success' : 'bg-twitch-error'}`}></span>
          </span>
          <span className="text-sm">{isConnected ? 'Connected' : 'Disconnected'}</span>
        </div>
        
        {/* Global Controls */}
        <Button 
          variant="destructive" 
          size="sm"
          onClick={handleToggleAllFarming}
          disabled={isPending}
          className="bg-twitch-purple hover:bg-twitch-lightpurple text-white flex items-center"
        >
          <StopCircle className="h-4 w-4 mr-2" />
          <span>Stop All</span>
        </Button>
        
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="icon"
            asChild
            className="bg-twitch-lightgray hover:bg-twitch-gray border-0 text-white md:hidden"
          >
            <a href="/settings">
              <Settings className="h-4 w-4" />
            </a>
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            asChild
            className="hidden md:inline-flex bg-purple-600 hover:bg-purple-700 border-0 text-white"
          >
            <a href="/settings">Settings</a>
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            asChild
            className="hidden md:inline-flex bg-purple-600 hover:bg-purple-700 border-0 text-white"
          >
            <a href="/admin">Admin Panel</a>
          </Button>
        </div>
      </div>
    </header>
  );
}
