import { BookOpen, LayoutDashboard, Users, BookCopy, CalendarClock, DollarSign, BarChart3, Settings, Search } from "lucide-react";
import { useState } from "react";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: BookOpen, label: "Catalog" },
  { icon: BookCopy, label: "Circulation" },
  { icon: Users, label: "Patrons" },
  { icon: CalendarClock, label: "Reservations" },
  { icon: DollarSign, label: "Fines & Fees" },
  { icon: BarChart3, label: "Analytics" },
  { icon: Settings, label: "Settings" },
];

const AppSidebar = () => {
  const [activeItem, setActiveItem] = useState("Dashboard");

  return (
    <aside className="w-64 min-h-screen bg-sidebar text-sidebar-foreground flex flex-col">
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h1 className="text-base font-display font-semibold text-sidebar-foreground">Athenaeum</h1>
            <p className="text-xs text-sidebar-foreground/50">Library System</p>
          </div>
        </div>
      </div>

      <div className="p-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-sidebar-accent text-sidebar-accent-foreground text-sm">
          <Search className="w-4 h-4 opacity-50" />
          <span className="opacity-50">Quick search…</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-1">
        {navItems.map(({ icon: Icon, label }) => (
          <button
            key={label}
            onClick={() => setActiveItem(label)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              activeItem === label
                ? "bg-sidebar-accent text-sidebar-primary"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            }`}
          >
            <Icon className="w-[18px] h-[18px]" />
            {label}
          </button>
        ))}
      </nav>

      <div className="p-4 mx-3 mb-4 rounded-lg bg-sidebar-accent">
        <p className="text-xs font-semibold text-sidebar-primary mb-1">System Status</p>
        <p className="text-xs text-sidebar-foreground/60">All services operational</p>
        <div className="flex items-center gap-1.5 mt-2">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-xs text-sidebar-foreground/50">Online</span>
        </div>
      </div>
    </aside>
  );
};

export default AppSidebar;
