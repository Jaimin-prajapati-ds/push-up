import { LayoutDashboard, Dumbbell, History, User, Trophy, Settings } from "lucide-react";

// Centralized ViewType to avoid mismatches
export type ViewType = "dashboard" | "pass" | "workout" | "situps" | "history" | "summary" | "profile" | "settings";

interface NavigationProps {
  currentView: ViewType;
  onChangeView: (view: ViewType) => void;
}

export function Navigation({ currentView, onChangeView }: NavigationProps) {
  const tabs = [
    { id: "dashboard" as const, icon: LayoutDashboard, label: "DASHBOARD" },
    { id: "pass" as const, icon: Trophy, label: "PASS" },
    { id: "workout" as const, icon: Dumbbell, label: "WORKOUT" },
    { id: "history" as const, icon: History, label: "HISTORY" },
    { id: "profile" as const, icon: User, label: "PROFILE" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full bg-[#0A0A0A]/90 backdrop-blur-xl border-t border-white/5 px-6 pt-3 pb-8 z-50">
      <div className="max-w-lg mx-auto flex items-center justify-between">
        {tabs.map((tab) => {
          const isActive = currentView === tab.id;
          const Icon = tab.icon;
          
          return (
            <button
              key={tab.id}
              onClick={() => onChangeView(tab.id as ViewType)}
              className="flex flex-col items-center gap-1.5 transition-all active:scale-90"
            >
              <div className={`transition-colors duration-300 ${isActive ? 'text-[#D4F45D]' : 'text-gray-500'}`}>
                <Icon size={24} strokeWidth={isActive ? 2.5 : 2} fill={isActive ? "currentColor" : "none"} fillOpacity={isActive ? 0.2 : 0} />
              </div>
              <span className={`text-[9px] font-black italic tracking-tighter transition-colors duration-300 ${isActive ? 'text-[#D4F45D]' : 'text-gray-500'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
