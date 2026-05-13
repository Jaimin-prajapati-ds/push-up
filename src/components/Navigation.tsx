import { Activity, LayoutDashboard, History, User } from "lucide-react";
import { cn } from "@/src/lib/utils";

type ViewType = "dashboard" | "workout" | "history" | "profile";

interface NavigationProps {
  currentView: ViewType;
  onChangeView: (view: ViewType) => void;
}

export function Navigation({ currentView, onChangeView }: NavigationProps) {
  const items = [
    { view: "dashboard" as const, icon: LayoutDashboard, label: "Home" },
    { view: "workout" as const, icon: Activity, label: "Workout" },
    { view: "history" as const, icon: History, label: "History" },
    { view: "profile" as const, icon: User, label: "Profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-2 pb-4 pt-2 bg-surface/80 backdrop-blur-lg border-t border-surface-container-highest">
      {items.map(({ view, icon: Icon, label }) => (
        <button 
          key={view}
          onClick={() => onChangeView(view)}
          className={cn(
            "flex flex-col items-center justify-center transition-all flex-1 py-1.5 rounded-xl",
            currentView === view 
              ? "bg-primary text-on-primary scale-90" 
              : "text-on-surface-variant hover:text-primary active:scale-95"
          )}
        >
          <Icon className="mb-0.5 w-5 h-5" strokeWidth={currentView === view ? 2.5 : 1.5} />
          <span className="font-label-caps text-[10px] uppercase tracking-widest leading-none">{label}</span>
        </button>
      ))}
    </nav>
  );
}
