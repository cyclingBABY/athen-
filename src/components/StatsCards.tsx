import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, BookCopy, Users, AlertTriangle } from "lucide-react";

const StatsCards = () => {
  const [stats, setStats] = useState({ totalBooks: 0, checkedOut: 0, activePatrons: 0, overdueItems: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const [booksRes, checkedOutRes, patronsRes, overdueRes] = await Promise.all([
        supabase.from("books").select("total_copies"),
        supabase.from("circulation_records").select("id").eq("status", "checked-out"),
        supabase.from("profiles").select("id").eq("approved", true),
        supabase.from("circulation_records").select("id").eq("status", "overdue"),
      ]);

      // Also check for overdue by due_date for checked-out items past due
      const { data: pastDueRecords } = await supabase
        .from("circulation_records")
        .select("id")
        .eq("status", "checked-out")
        .lt("due_date", new Date().toISOString());

      const overdueCount = (overdueRes.data?.length || 0) + (pastDueRecords?.length || 0);

      setStats({
        totalBooks: booksRes.data?.reduce((sum, b) => sum + (b.total_copies || 0), 0) || 0,
        checkedOut: checkedOutRes.data?.length || 0,
        activePatrons: patronsRes.data?.length || 0,
        overdueItems: overdueCount,
      });
    };
    fetchStats();
  }, []);

  const cards = [
    { label: "Total Books", value: stats.totalBooks.toLocaleString(), icon: BookOpen, color: "text-primary" },
    { label: "Checked Out", value: stats.checkedOut.toLocaleString(), icon: BookCopy, color: "text-info" },
    { label: "Active Patrons", value: stats.activePatrons.toLocaleString(), icon: Users, color: "text-accent" },
    { label: "Overdue Items", value: stats.overdueItems.toString(), icon: AlertTriangle, color: "text-destructive" },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map(({ label, value, icon: Icon, color }) => (
        <div key={label} className="bg-card rounded-xl border p-5 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-muted-foreground">{label}</span>
            <Icon className={`w-5 h-5 ${color}`} />
          </div>
          <p className="text-2xl font-display font-bold">{value}</p>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
