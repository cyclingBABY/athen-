import { useState, useEffect } from "react";
import { Home, Search, BookCopy, CalendarClock, DollarSign, User, LogOut, Menu, Library, Shield, GraduationCap } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  DrawerClose
} from "@/components/ui/drawer";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet";
import LibraryIDCard from "@/components/LibraryIDCard";

const MobileUserNavigation = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [openDrawer, setOpenDrawer] = useState(false);
  const [openSheet, setOpenSheet] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
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

        {/* Right side profile circle / trigger ID card */}
        <button
          onClick={() => setOpenDrawer(true)}
          className="w-8 h-8 rounded-full border border-primary/20 bg-muted overflow-hidden flex items-center justify-center text-sm font-bold text-primary"
        >
          {profile?.photo_url ? (
            <img src={profile.photo_url} alt="" className="w-full h-full object-cover" />
          ) : (
            profile?.full_name?.[0]?.toUpperCase() || "U"
          )}
        </button>
      </header>

      {/* Sticky Bottom Navigation Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-lg border-t border-border z-40 md:hidden flex justify-around items-center h-16 px-2 safe-bottom">
        {/* Home */}
        <NavLink
          to="/home"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 h-full text-[10px] font-medium transition-colors ${isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`
          }
        >
          <Home className="w-5 h-5 mb-0.5" />
          <span>Home</span>
        </NavLink>

        {/* Catalog */}
        <NavLink
          to="/catalog"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 h-full text-[10px] font-medium transition-colors ${isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`
          }
        >
          <Search className="w-5 h-5 mb-0.5" />
          <span>Catalog</span>
        </NavLink>

        {/* Floating ID Card Trigger */}
        <div className="flex-1 flex justify-center relative -top-3 h-full">
          <Drawer open={openDrawer} onOpenChange={setOpenDrawer}>
            <DrawerTrigger asChild>
              <button className="w-14 h-14 bg-primary text-primary-foreground rounded-full shadow-lg shadow-primary/20 border-4 border-background flex items-center justify-center hover:scale-105 active:scale-95 transition-transform duration-200">
                <Library className="w-6 h-6" />
              </button>
            </DrawerTrigger>
            <DrawerContent className="pb-6">
              <DrawerHeader>
                <DrawerTitle className="text-center font-display font-semibold text-xl">My Library Card</DrawerTitle>
              </DrawerHeader>
              <div className="p-4 flex flex-col items-center justify-center">
                {isLoading ? (
                  <div className="h-40 flex items-center justify-center">Loading Library Card...</div>
                ) : profile?.approved ? (
                  <LibraryIDCard
                    fullName={profile.full_name || "Member"}
                    email={profile.email || ""}
                    cardNumber={profile.library_card_number || ""}
                    role="patron"
                    photoUrl={profile.photo_url}
                    campus={profile.campus}
                    registrationNumber={profile.registration_number}
                  />
                ) : (
                  <div className="text-center p-6 bg-muted rounded-xl text-muted-foreground max-w-sm">
                    <p className="font-semibold mb-2">Membership Pending Approval</p>
                    <p className="text-xs">Once the administrator approves your account, your digital library ID card will be activated.</p>
                  </div>
                )}
              </div>
            </DrawerContent>
          </Drawer>
          <span className="absolute bottom-1 text-[10px] font-medium text-muted-foreground pointer-events-none">ID Card</span>
        </div>

        {/* My Books */}
        <NavLink
          to="/my-books"
          className={({ isActive }) =>
            `flex flex-col items-center justify-center flex-1 h-full text-[10px] font-medium transition-colors ${isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            }`
          }
        >
          <BookCopy className="w-5 h-5 mb-0.5" />
          <span>My Books</span>
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
                  onClick={() => { setOpenSheet(false); navigate("/holds"); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${location.pathname === "/holds"
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                >
                  <CalendarClock className="w-4 h-4" />
                  Holds
                </button>

                <button
                  onClick={() => { setOpenSheet(false); navigate("/reservations"); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${location.pathname === "/reservations"
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                >
                  <CalendarClock className="w-4 h-4" />
                  Reservations
                </button>

                <button
                  onClick={() => { setOpenSheet(false); navigate("/fines"); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${location.pathname === "/fines"
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                >
                  <DollarSign className="w-4 h-4" />
                  Fines & Fees
                </button>

                <button
                  onClick={() => { setOpenSheet(false); navigate("/clearance"); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${location.pathname === "/clearance"
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                >
                  <Shield className="w-4 h-4" />
                  Clearance Status
                </button>

                <button
                  onClick={() => { setOpenSheet(false); navigate("/academic-services"); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${location.pathname === "/academic-services"
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                >
                  <GraduationCap className="w-4 h-4" />
                  Academic Services
                </button>

                <button
                  onClick={() => { setOpenSheet(false); navigate("/profile"); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${location.pathname === "/profile"
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                >
                  <User className="w-4 h-4" />
                  My Profile
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

export default MobileUserNavigation;
