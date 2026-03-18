import { BookOpen, LayoutDashboard, Users, BookCopy, CalendarClock, DollarSign, BarChart3, Settings, Search, LogOut, QrCode, Upload, MapPin, ArrowRightLeft, ClipboardList, Shield, Trash2, FileSpreadsheet, ScanLine, UserCheck, GraduationCap } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, useLocation } from "react-router-dom";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: BookOpen, label: "Cataloging", path: "/admin/cataloging" },
  { icon: QrCode, label: "Barcoding", path: "/admin/barcoding" },
  { icon: Upload, label: "Digital Upload", path: "/admin/digital-upload" },
  { icon: MapPin, label: "Shelf Location", path: "/admin/shelf-location" },
  { icon: ArrowRightLeft, label: "Circulation", path: "/admin/circulation" },
  { icon: UserCheck, label: "Approvals", path: "/admin/approvals" },
  { icon: Users, label: "Patrons", path: "/admin/patrons" },
  { icon: GraduationCap, label: "Lecturers", path: "/admin/lecturers" },
  { icon: ClipboardList, label: "Inventory", path: "/admin/inventory" },
  { icon: CalendarClock, label: "Holds", path: "/admin/holds" },
  { icon: DollarSign, label: "Fines & Fees", path: "/admin/fines" },
  { icon: Shield, label: "Digital Access", path: "/admin/digital-access" },
  { icon: Trash2, label: "Weeding", path: "/admin/weeding" },
  { icon: BarChart3, label: "Reporting", path: "/admin/reporting" },
  { icon: FileSpreadsheet, label: "Bulk Import", path: "/admin/bulk-import" },
  { icon: ScanLine, label: "QR Scanner", path: "/admin/qr-scanner" },
];

const AppSidebar = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside className="w-64 min-h-screen bg-sidebar text-sidebar-foreground flex flex-col shrink-0">
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h1 className="text-base font-display font-semibold text-sidebar-foreground">Athena</h1>
            <p className="text-xs text-sidebar-foreground/50">Admin Panel</p>
          </div>
        </div>
      </div>

      <div className="p-3">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-sidebar-accent text-sidebar-accent-foreground text-sm">
          <Search className="w-4 h-4 opacity-50" />
          <span className="opacity-50">Quick search…</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-2 space-y-0.5 overflow-y-auto">
        {navItems.map(({ icon: Icon, label, path }) => (
          <button
            key={label}
            onClick={() => navigate(path)}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              location.pathname === path
                ? "bg-sidebar-accent text-sidebar-primary"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
            }`}
          >
            <Icon className="w-[18px] h-[18px] shrink-0" />
            {label}
          </button>
        ))}
      </nav>

      <div className="p-4 mx-3 mb-2 rounded-lg bg-sidebar-accent">
        <p className="text-xs font-semibold text-sidebar-primary mb-1">System Status</p>
        <p className="text-xs text-sidebar-foreground/60">All services operational</p>
        <div className="flex items-center gap-1.5 mt-2">
          <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
          <span className="text-xs text-sidebar-foreground/50">Online</span>
        </div>
      </div>

      <div className="p-3">
        <button
          onClick={() => { signOut(); navigate("/"); }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
        >
          <LogOut className="w-[18px] h-[18px]" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default AppSidebar;
