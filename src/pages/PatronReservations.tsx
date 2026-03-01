import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import PatronSidebar from "@/components/PatronSidebar";
import { Badge } from "@/components/ui/badge";
import { CalendarClock, X } from "lucide-react";

const statusStyles: Record<string, string> = {
  active: "bg-warning/10 text-warning border-warning/20",
  fulfilled: "bg-success/10 text-success border-success/20",
  cancelled: "bg-muted text-muted-foreground border-border",
};

const PatronReservations = () => {
  const [reservations, setReservations] = useState<any[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchReservations = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("reservations")
      .select("*, books(title, author, cover_color)")
      .eq("user_id", user.id)
      .order("reservation_date", { ascending: false });
    if (data) setReservations(data);
  };

  useEffect(() => { fetchReservations(); }, [user]);

  const handleCancel = async (id: string) => {
    const { error } = await supabase.from("reservations").update({ status: "cancelled" }).eq("id", id);
    if (error) {
      toast({ title: "Failed to cancel", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Reservation cancelled" });
      fetchReservations();
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <PatronSidebar />
      <main className="flex-1 p-6 overflow-auto">
        <h1 className="text-2xl font-display font-bold mb-6">My Reservations</h1>

        <div className="bg-card rounded-xl border">
          {reservations.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <CalendarClock className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p>No reservations yet</p>
              <p className="text-xs mt-1">Browse the catalog to reserve books</p>
            </div>
          ) : (
            <div className="divide-y">
              {reservations.map((r) => (
                <div key={r.id} className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-11 rounded-sm shadow-sm" style={{ backgroundColor: r.books?.cover_color || "hsl(210 60% 50%)" }} />
                    <div>
                      <p className="font-medium text-sm">{r.books?.title}</p>
                      <p className="text-xs text-muted-foreground">{r.books?.author} · Reserved {new Date(r.reservation_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={`text-xs capitalize ${statusStyles[r.status]}`}>{r.status}</Badge>
                    {r.status === "active" && (
                      <button onClick={() => handleCancel(r.id)} className="flex items-center gap-1 text-xs font-medium text-destructive hover:underline">
                        <X className="w-3.5 h-3.5" /> Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default PatronReservations;
