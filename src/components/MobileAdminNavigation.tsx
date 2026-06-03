import { useState } from "react";
import { 
  BookOpen, LayoutDashboard, Users, BookCopy, CalendarClock, DollarSign, 
  BarChart3, Settings, Search, LogOut, QrCode, Upload, MapPin, 
  ArrowRightLeft, ClipboardList, Shield, Trash2, FileSpreadsheet, 
  ScanLine, UserCheck, GraduationCap, Menu, Library
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet";

const MobileAdminNavigation = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [openSheet, setOpenSheet] = useState(false);

  // Grouped Navigation Items for cleaner UI in mobile sheet
  const sections = [
    {
      title: "Core Operations",
      items: [
        { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
        { icon: BookOpen, label: "Cataloging", path: "/admin/cataloging" },
        { icon: Upload, label: "Digital Upload", path: "/admin/digital-upload" },
        { icon: MapPin, label: "Shelf Location", path: "/admin/shelf-location" },
      ]
    },
    {
      title: "Circulation & Members",
      items: [
        { icon: ArrowRightLeft, label: "Circulation", path: "/admin/circulation" },
        { icon: UserCheck, label: "Approvals", path: "/admin/approvals" },
        { icon: Users, label: "Users", path: "/admin/users" },
        { icon: GraduationCap, label: "Lecturers", path: "/admin/lecturers" },
        { icon: CalendarClock, label: "Holds", path: "/admin/holds" },
        { icon: DollarSign, label: "Fines & Fees", path: "/admin/fines" },
      ]
    },
    {
      title: "Management & Scanner Tools",
      items: [
        { icon: ScanLine, label: "QR Scanner", path: "/admin/qr-scanner" },
        { icon: QrCode, label: "Barcoding", path: "/admin/barcoding" },
        { icon: ScanLine, label: "Barcode Station", path: "/admin/barcode-station" },
        { icon: ClipboardList, label: "Inventory", path: "/admin/inventory" },
        { icon: Shield, label: "Digital Access", path: "/admin/digital-access" },
        { icon: Trash2, label: "Weeding", path: "/admin/weeding" },
        { icon: BarChart3, label: "Reporting", path: "/admin/reporting" },
        { icon: FileSpreadsheet, label: "Bulk Import", path: "/admin/bulk-import" },
      ]
    }
  ];

  return (
    <>
      {/* Sticky Top Header */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-background/85 backdrop-blur-md border-b z-40 flex items-center justify-between px-4 md:hidden">
        <div className="flex items-center gap-2">
          <Library className="w-5 h-5 text-primary" />
          <span className="font-display font-bold text-lg text-foreground tracking-wide">Athena Admin</span>
        </div>
        
        {/* Quick Online Indicator */}
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-success animate-pulse" />
          <span className="text-xs text-muted-foreground font-medium">Online</span>
        </div>
      </header>

      {/* Sticky Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-lg border-t border-border z-40 md:hidden flex justify-around items-center h-16 px-2 safe-bottom">
        {/* Dashboard */}
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 h-full text-[10px] font-medium transition-colors ${
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`
          }
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span>Dashboard</span>
        </NavLink>

        {/* QR Scanner (Extremely useful for mobile admins scanning codes) */}
        <NavLink
          to="/admin/qr-scanner"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 h-full text-[10px] font-medium transition-colors ${
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`
          }
        >
          <ScanLine className="w-5 h-5 mb-0.5" />
          <span>Scanner</span>
        </NavLink>

        {/* Circulation */}
        <NavLink
          to="/admin/circulation"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 h-full text-[10px] font-medium transition-colors ${
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`
          }
        >
          <ArrowRightLeft className="w-5 h-5 mb-0.5" />
          <span>Circulation</span>
        </NavLink>

        {/* Approvals */}
        <NavLink
          to="/admin/approvals"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 h-full text-[10px] font-medium transition-colors ${
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`
          }
        >
          <UserCheck className="w-5 h-5 mb-0.5" />
          <span>Approvals</span>
        </NavLink>

        {/* Hamburger Menu for all other 18 panels */}
        <Sheet open={openSheet} onOpenChange={setOpenSheet}>
          <SheetTrigger asChild>
            <button className="flex flex-col items-center justify-center flex-1 h-full text-[10px] font-medium text-muted-foreground hover:text-foreground">
              <Menu className="w-5 h-5 mb-0.5" />
              <span>Panels</span>
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-4/5 max-w-[320px] p-0 flex flex-col justify-between">
            <div className="overflow-y-auto flex-1">
              <SheetHeader className="p-6 border-b sticky top-0 bg-background z-10">
                <SheetTitle className="text-left font-display">Admin Control Center</SheetTitle>
              </SheetHeader>
              <div className="p-4 space-y-6">
                {sections.map((sec) => (
                  <div key={sec.title} className="space-y-1.5">
                    <h3 className="text-xs font-semibold text-muted-foreground/80 uppercase tracking-wider px-3 mb-1">
                      {sec.title}
                    </h3>
                    {sec.items.map((item) => {
                      const Icon = item.icon;
                      const isSelected = location.pathname === item.path;
                      return (
                        <button
                          key={item.label}
                          onClick={() => { setOpenSheet(false); navigate(item.path); }}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                            isSelected
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground"
                          }`}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-border sticky bottom-0 bg-background">
              <button
                onClick={() => { signOut(); navigate("/"); }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
};

export default MobileAdminNavigation;
