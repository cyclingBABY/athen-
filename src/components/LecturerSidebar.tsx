import { BookOpen, Home, BookCopy, ListChecks, Upload, Star, BookPlus, Library, Bell, User, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { NavLink } from "react-router-dom";

const navItems = [
  { icon: Home, label: "Dashboard", to: "/lecturer/dashboard" },
  { icon: BookCopy, label: "My Borrowed Books", to: "/lecturer/my-books" },
  { icon: ListChecks, label: "Course Reading Lists", to: "/lecturer/reading-lists" },
  { icon: Upload, label: "Upload Materials", to: "/lecturer/upload" },
  { icon: Star, label: "Recommended Books", to: "/lecturer/recommendations" },
  { icon: BookPlus, label: "Book Requests", to: "/lecturer/requests" },
  { icon: Library, label: "Digital Library", to: "/lecturer/digital-library" },
  { icon: Bell, label: "Notifications", to: "/lecturer/notifications" },
  { icon: User, label: "Profile", to: "/lecturer/profile" },
];

const LecturerSidebar = () => {
  const { signOut } = useAuth();

  return (
    <aside className="w-64 min-h-screen bg-sidebar text-sidebar-foreground flex flex-col">
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-sidebar-primary flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          <div>
            <h1 className="text-base font-display font-semibold text-sidebar-foreground">Athena</h1>
            <p className="text-xs text-sidebar-foreground/50">Lecturer Portal</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ icon: Icon, label, to }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
              }`
            }
          >
            <Icon className="w-[18px] h-[18px]" />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="p-3 mb-2">
        <button
          onClick={() => { signOut(); window.location.href = "/"; }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
        >
          <LogOut className="w-[18px] h-[18px]" />
          Sign Out
        </button>
      </div>
    </aside>
  );
};

export default LecturerSidebar;
