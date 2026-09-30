import React from "react";
import { 
  MessageSquare, 
  Users, 
  Flame, 
  Settings, 
  ShieldCheck, 
  Search, 
  Sparkles,
  Hourglass,
  PhoneCall
} from "lucide-react";

export type NavTab = "chat" | "connectors" | "streaks" | "capsule" | "calls" | "settings";

interface NavigationProps {
  activeTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
  unreadChatCount?: number;
  connectorsCount?: number;
  timeCapsuleCount?: number;
  callsCount?: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onChangeTab,
  unreadChatCount = 0,
  connectorsCount = 0,
  timeCapsuleCount = 0,
  callsCount = 0,
}) => {
  const tabs = [
    {
      id: "chat" as NavTab,
      label: "Family Room",
      icon: MessageSquare,
      badge: unreadChatCount > 0 ? `${unreadChatCount} New` : null,
      badgeColor: "bg-[#0F5132] text-white",
    },
    {
      id: "connectors" as NavTab,
      label: "Connectors",
      icon: Users,
      badge: connectorsCount > 0 ? `${connectorsCount}` : "Personal Code",
      badgeColor: "bg-[#0F5132]/15 text-[#0F5132] font-mono font-bold",
    },
    {
      id: "streaks" as NavTab,
      label: "Daily Streaks",
      icon: Flame,
      badge: "🔥 Live",
      badgeColor: "bg-amber-500 text-white font-black",
    },
    {
      id: "capsule" as NavTab,
      label: "Time Capsule",
      icon: Hourglass,
      badge: timeCapsuleCount > 0 ? `${timeCapsuleCount}` : "Diwali 🪔",
      badgeColor: "bg-amber-100 text-amber-900 border border-amber-300 font-bold",
    },
    {
      id: "calls" as NavTab,
      label: "Call Logs",
      icon: PhoneCall,
      badge: callsCount > 0 ? `${callsCount}` : "AI Log",
      badgeColor: "bg-blue-100 text-blue-900 border border-blue-200 font-bold",
    },
    {
      id: "settings" as NavTab,
      label: "Profile & Security",
      icon: Settings,
    },
  ];

  return (
    <nav className="w-full">
      {/* Desktop / Tablet Tab Bar */}
      <div className="hidden md:flex items-center justify-between border-b border-slate-200 pb-3 mb-6 gap-3">
        <div className="flex items-center space-x-2 overflow-x-auto scrollbar-none">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-nav-${tab.id}`}
                onClick={() => onChangeTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "bg-[#0F5132] text-white shadow-sm ring-1 ring-[#0F5132]"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-emerald-200" : "text-slate-500"}`} />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tab.badgeColor}`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 text-xs font-semibold rounded-full border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
            <span>Firestore Real-Time Sync</span>
          </div>
        </div>
      </div>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-2 flex justify-around items-center shadow-lg">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`mobile-tab-nav-${tab.id}`}
              onClick={() => onChangeTab(tab.id)}
              className={`flex flex-col items-center justify-center py-1 px-2 relative transition cursor-pointer ${
                isActive ? "text-[#0F5132]" : "text-slate-500 hover:text-slate-800"
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? "stroke-[2.5]" : "stroke-[1.8]"}`} />
                {isActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-[#0F5132]" />
                )}
              </div>
              <span className={`text-[10px] mt-1 whitespace-nowrap ${isActive ? "font-bold text-[#0F5132]" : "font-medium"}`}>
                {tab.id === "chat" ? "Family Room" : tab.id === "connectors" ? "Connectors" : tab.id === "streaks" ? "Streaks" : "Profile"}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
