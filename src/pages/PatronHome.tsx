import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import PatronSidebar from "@/components/PatronSidebar";
import ContinueReadingShelf from "@/components/ContinueReadingShelf";
import { BookOpen, BookCopy, CalendarClock, DollarSign, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const PatronHome = () => {
  const { user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("full_name").eq("user_id", user!.id).single();
      return data;
    },
    enabled: !!user,
  });

  const { data: activeLoans } = useQuery({
    queryKey: ["active-loans-count", user?.id],
    queryFn: async () => {
      const { count } = await supabase.from("circulation_records").select("*", { count: "exact", head: true }).eq("user_id", user!.id).eq("status", "checked-out");
      return count ?? 0;
    },
    enabled: !!user,
  });

  const { data: activeReservations } = useQuery({
    queryKey: ["active-reservations-count", user?.id],
    queryFn: async () => {
      const { count } = await supabase.from("reservations").select("*", { count: "exact", head: true }).eq("user_id", user!.id).eq("status", "active");
      return count ?? 0;
    },
    enabled: !!user,
  });

  const { data: unpaidFines } = useQuery({
    queryKey: ["unpaid-fines-total", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("fines").select("amount").eq("user_id", user!.id).eq("paid", false);
      return data?.reduce((sum, f) => sum + Number(f.amount), 0) ?? 0;
    },
    enabled: !!user,
  });

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 17) return "Good afternoon";
    return "Good evening";
  };

  const quickActions = [
    { icon: BookOpen, label: "Browse Catalog", description: "Discover new books", to: "/catalog", color: "bg-primary/10 text-primary" },
    { icon: BookCopy, label: "My Books", description: `${activeLoans ?? 0} active loans`, to: "/my-books", color: "bg-accent/10 text-accent" },
    { icon: CalendarClock, label: "Reservations", description: `${activeReservations ?? 0} pending`, to: "/reservations", color: "bg-[hsl(var(--chart-4))]/10 text-[hsl(var(--chart-4))]" },
    { icon: DollarSign, label: "Fines & Fees", description: unpaidFines ? `$${unpaidFines.toFixed(2)} due` : "All clear!", to: "/fines", color: unpaidFines ? "bg-destructive/10 text-destructive" : "bg-accent/10 text-accent" },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <PatronSidebar />
      <main className="flex-1 p-6 md:p-8 overflow-auto">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground">
            {greeting()}, {profile?.full_name || "Reader"}
          </h1>
          <p className="text-muted-foreground mt-1">
            Welcome back to Athena. Here's your library overview.
          </p>
        </div>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {quickActions.map(({ icon: Icon, label, description, to, color }) => (
            <Link key={to} to={to} className="group bg-card border rounded-xl p-5 hover:shadow-md transition-all hover:-translate-y-0.5">
              <div className="flex items-start justify-between">
                <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center`}>
                  <Icon className="w-5 h-5" />
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity mt-1" />
              </div>
              <h3 className="font-semibold text-foreground mt-3">{label}</h3>
              <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
            </Link>
          ))}
        </div>

        {/* Continue Reading Shelf */}
        <ContinueReadingShelf myBooksLink="/my-books" />
      </main>
    </div>
  );
};

export default PatronHome;
