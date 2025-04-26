import { useLocation } from "wouter";
import { useSettings } from "@/hooks/use-twitch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { X, LayoutDashboard, Tv2, BarChart3, FileText, Settings } from "lucide-react";

interface SidebarProps {
  isOpen: boolean;
  closeSidebar: () => void;
}

export default function Sidebar({ isOpen, closeSidebar }: SidebarProps) {
  const [location] = useLocation();
  const { data: settings } = useSettings();

  const isActive = (path: string) => {
    if (path === "/dashboard" && (location === "/" || location === "/dashboard")) {
      return true;
    }
    return location === path;
  };

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="mr-3 h-5 w-5" /> },
    { path: "/channels", label: "Channels", icon: <Tv2 className="mr-3 h-5 w-5" /> },
    { path: "/statistics", label: "Statistics", icon: <BarChart3 className="mr-3 h-5 w-5" /> },
    { path: "/logs", label: "Logs", icon: <FileText className="mr-3 h-5 w-5" /> },
    { path: "/settings", label: "Settings", icon: <Settings className="mr-3 h-5 w-5" /> },
  ];

  // Hide the sidebar on small screens if it's not open
  const sidebarClasses = `w-64 bg-twitch-gray border-r border-twitch-lightgray md:block transition-all duration-300 ${
    isOpen ? "fixed inset-y-0 left-0 z-50" : "hidden"
  }`;

  // Get webhook URL and obfuscate it for display
  const getObfuscatedWebhook = () => {
    if (!settings?.discordWebhookUrl) return "Not configured";
    
    const url = settings.discordWebhookUrl;
    const parts = url.split('/');
    if (parts.length < 7) return "Invalid webhook URL";
    
    const webhookId = parts[5];
    const webhookToken = parts[6];
    
    const obfuscatedId = webhookId.substring(0, 5) + '*'.repeat(webhookId.length - 5);
    const obfuscatedToken = webhookToken.substring(0, 4) + '*'.repeat(webhookToken.length - 4);
    
    return `${parts[0]}//${parts[2]}/${parts[3]}/${parts[4]}/${obfuscatedId}/${obfuscatedToken}`;
  };

  return (
    <aside className={sidebarClasses}>
      {isOpen && (
        <div className="md:hidden p-4 flex justify-end">
          <Button variant="ghost" size="icon" onClick={closeSidebar}>
            <X className="h-5 w-5" />
          </Button>
        </div>
      )}
      
      <nav className="p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.path}>
              <a
                href={item.path}
                className={`flex items-center px-4 py-3 rounded-md ${
                  isActive(item.path)
                    ? "bg-twitch-purple text-white"
                    : "hover:bg-twitch-lightgray"
                }`}
                onClick={(e) => {
                  if (isOpen) {
                    closeSidebar();
                  }
                }}
              >
                {item.icon}
                <span>{item.label}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-twitch-lightgray mt-4">
        <h3 className="text-sm font-semibold uppercase text-gray-400 mb-2">Discord Webhook</h3>
        <div className="bg-twitch-darker p-2 rounded text-xs font-mono text-gray-400 break-all">
          {getObfuscatedWebhook()}
        </div>
        <div className="mt-3 flex items-center text-sm text-twitch-success">
          <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span>Connected</span>
        </div>
      </div>
    </aside>
  );
}
