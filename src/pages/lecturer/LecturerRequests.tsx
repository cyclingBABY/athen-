import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import LecturerLayout from "@/components/LecturerLayout";
import { BookPlus } from "lucide-react";

const LecturerRequests = () => {
  const { user } = useAuth();

  const { data: reservations, isLoading } = useQuery({
    queryKey: ["lecturer-reservations", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("reservations")
        .select("*, books(title, author)")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!user,
  });

  return (
    <LecturerLayout title="Book Requests" description="Your book hold requests and reservations">
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !reservations?.length ? (
        <div className="text-center py-20">
          <BookPlus className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No book requests yet.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {reservations.map((r: any) => (
            <div key={r.id} className="bg-card border rounded-xl p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-foreground">{r.books?.title}</p>
                <p className="text-sm text-muted-foreground">by {r.books?.author}</p>
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                r.status === "active" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
              }`}>{r.status}</span>
            </div>
          ))}
        </div>
      )}
    </LecturerLayout>
  );
};

export default LecturerRequests;
