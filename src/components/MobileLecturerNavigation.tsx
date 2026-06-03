import { useState } from "react";
import { Home, BookCopy, ListChecks, Upload, Star, BookPlus, Library, Bell, User, LogOut, Menu } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet";

const MobileLecturerNavigation = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [openSheet, setOpenSheet] = useState(false);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  return (
    <>
      {/* Sticky Top Header */}
      <header className="fixed top-0 left-0 right-0 h-14 bg-background/80 backdrop-blur-md border-b z-40 flex items-center justify-between px-4 md:hidden">
        <div className="flex items-center gap-2">
          <Library className="w-5 h-5 text-primary" />
          <span className="font-display font-bold text-lg text-foreground tracking-wide">Athena</span>
        </div>
        
        {/* Right side user indicator */}
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate("/lecturer/notifications")}
            className="p-1 text-muted-foreground hover:text-foreground relative"
          >
            <Bell className="w-5 h-5" />
          </button>
          <div 
            onClick={() => navigate("/lecturer/profile")}
            className="w-8 h-8 rounded-full border border-primary/20 bg-muted overflow-hidden flex items-center justify-center text-sm font-bold text-primary cursor-pointer"
          >
            {profile?.photo_url ? (
              <img src={profile.photo_url} alt="" className="w-full h-full object-cover" />
            ) : (
              profile?.full_name?.[0]?.toUpperCase() || "L"
            )}
          </div>
        </div>
      </header>

      {/* Sticky Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-lg border-t border-border z-40 md:hidden flex justify-around items-center h-16 px-2 safe-bottom">
        {/* Dashboard */}
        <NavLink
          to="/lecturer/dashboard"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 h-full text-[10px] font-medium transition-colors ${
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`
          }
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span>Dashboard</span>
        </NavLink>

        {/* My Borrowed Books */}
        <NavLink
          to="/lecturer/my-books"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 h-full text-[10px] font-medium transition-colors ${
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`
          }
        >
          <BookCopy className="w-5 h-5 mb-0.5" />
          <span>My Books</span>
        </NavLink>

        {/* Reading Lists */}
        <NavLink
          to="/lecturer/reading-lists"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 h-full text-[10px] font-medium transition-colors ${
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`
          }
        >
          <ListChecks className="w-5 h-5 mb-0.5" />
          <span>Readings</span>
        </NavLink>

        {/* Upload Materials */}
        <NavLink
          to="/lecturer/upload"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 h-full text-[10px] font-medium transition-colors ${
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`
          }
        >
          <Upload className="w-5 h-5 mb-0.5" />
          <span>Upload</span>
        </NavLink>

        {/* More Options Sheet */}
        <Sheet open={openSheet} onOpenChange={setOpenSheet}>
          <SheetTrigger asChild>
            <button className="flex flex-col items-center justify-center flex-1 h-full text-[10px] font-medium text-muted-foreground hover:text-foreground">
              <Menu className="w-5 h-5 mb-0.5" />
              <span>More</span>
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-3/4 max-w-[280px] p-0 flex flex-col justify-between">
            <div>
              <SheetHeader className="p-6 border-b">
                <SheetTitle className="text-left font-display">Athena Menu</SheetTitle>
              </SheetHeader>
              <div className="p-4 space-y-1">
                <button
                  onClick={() => { setOpenSheet(false); navigate("/lecturer/recommendations"); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === "/lecturer/recommendations"
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Star className="w-4 h-4" />
                  Recommendations
                </button>
                
                <button
                  onClick={() => { setOpenSheet(false); navigate("/lecturer/requests"); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === "/lecturer/requests"
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <BookPlus className="w-4 h-4" />
                  Book Requests
                </button>

                <button
                  onClick={() => { setOpenSheet(false); navigate("/lecturer/digital-library"); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === "/lecturer/digital-library"
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Library className="w-4 h-4" />
                  Digital Library
                </button>

                <button
                  onClick={() => { setOpenSheet(false); navigate("/lecturer/profile"); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    location.pathname === "/lecturer/profile"
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <User className="w-4 h-4" />
                  Profile Settings
                </button>
              </div>
            </div>

            <div className="p-4 border-t border-border">
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

export default MobileLecturerNavigation;
