import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import LecturerSidebar from "@/components/LecturerSidebar";
import ContinueReadingShelf from "@/components/ContinueReadingShelf";
import { BookCopy, ListChecks, Star, Bell, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const LecturerDashboard = () => {
  const { user } = useAuth();

  const { data: profile } = useQuery({
    queryKey: ["lecturer-profile", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("full_name, department, staff_id").eq("user_id", user!.id).single();
      return data;
    },
    enabled: !!user,
  });

  const { data: activeLoans } = useQuery({
    queryKey: ["lecturer-loans", user?.id],
    queryFn: async () => {
      const { count } = await supabase.from("circulation_records").select("*", { count: "exact", head: true }).eq("user_id", user!.id).eq("status", "checked-out");
      return count ?? 0;
    },
    enabled: !!user,
  });

  const { data: readingListCount } = useQuery({
    queryKey: ["lecturer-reading-lists-count", user?.id],
    queryFn: async () => {
      const { count } = await supabase.from("course_reading_lists").select("*", { count: "exact", head: true }).eq("lecturer_id", user!.id);
      return count ?? 0;
    },
    enabled: !!user,
  });

  const { data: recommendationCount } = useQuery({
    queryKey: ["lecturer-recommendations-count", user?.id],
    queryFn: async () => {
      const { count } = await supabase.from("book_recommendations").select("*", { count: "exact", head: true }).eq("lecturer_id", user!.id);
      return count ?? 0;
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
    { icon: BookCopy, label: "My Books", description: `${activeLoans ?? 0} active loans`, to: "/lecturer/my-books", color: "bg-primary/10 text-primary" },
    { icon: ListChecks, label: "Reading Lists", description: `${readingListCount ?? 0} courses`, to: "/lecturer/reading-lists", color: "bg-accent/10 text-accent" },
    { icon: Star, label: "Recommendations", description: `${recommendationCount ?? 0} submitted`, to: "/lecturer/recommendations", color: "bg-[hsl(var(--chart-4))]/10 text-[hsl(var(--chart-4))]" },
    { icon: Bell, label: "Notifications", description: "View updates", to: "/lecturer/notifications", color: "bg-[hsl(var(--chart-5))]/10 text-[hsl(var(--chart-5))]" },
  ];

  return (
    <div className="flex min-h-screen bg-background">
      <LecturerSidebar />
      <main className="flex-1 p-6 md:p-8 overflow-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-foreground">
            {greeting()}, {profile?.full_name || "Lecturer"}
          </h1>
          <p className="text-muted-foreground mt-1">
            {profile?.department ? `${profile.department} Department` : "Welcome to Athena Lecturer Portal"}
          </p>
        </div>

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
        <ContinueReadingShelf myBooksLink="/lecturer/my-books" />
      </main>
    </div>
  );
};

export default LecturerDashboard;
