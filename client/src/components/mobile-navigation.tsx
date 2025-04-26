import { useLocation } from "wouter";
import { LayoutDashboard, Tv2, BarChart3, FileText } from "lucide-react";

export default function MobileNavigation() {
  const [location] = useLocation();

  const isActive = (path: string) => {
    if (path === "/dashboard" && (location === "/" || location === "/dashboard")) {
      return true;
    }
    return location === path;
  };

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: <LayoutDashboard className="text-xl" /> },
    { path: "/channels", label: "Channels", icon: <Tv2 className="text-xl" /> },
    { path: "/statistics", label: "Stats", icon: <BarChart3 className="text-xl" /> },
    { path: "/logs", label: "Logs", icon: <FileText className="text-xl" /> },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-twitch-darker border-t border-twitch-lightgray md:hidden z-10">
      <div className="flex justify-around">
        {navItems.map((item) => (
          <a
            key={item.path}
            href={item.path}
            className={`flex flex-col items-center py-3 ${
              isActive(item.path) ? "text-twitch-purple" : "text-gray-400"
            }`}
          >
            {item.icon}
            <span className="text-xs mt-1">{item.label}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
