import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import LecturerLayout from "@/components/LecturerLayout";
import { Star, Plus, Clock, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const LecturerRecommendations = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [isbn, setIsbn] = useState("");
  const [reason, setReason] = useState("");

  const { data: recommendations, isLoading } = useQuery({
    queryKey: ["recommendations", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("book_recommendations")
        .select("*")
        .eq("lecturer_id", user!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
    enabled: !!user,
  });

  const createRec = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("book_recommendations").insert({
        lecturer_id: user!.id,
        title,
        author,
        isbn: isbn || null,
        reason: reason || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["recommendations"] });
      setShowForm(false);
      setTitle(""); setAuthor(""); setIsbn(""); setReason("");
      toast({ title: "Recommendation submitted" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const statusBadge = (status: string) => {
    switch (status) {
      case "approved": return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium"><CheckCircle className="w-3 h-3" />Approved</span>;
      case "rejected": return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-destructive/10 text-destructive text-xs font-medium"><XCircle className="w-3 h-3" />Rejected</span>;
      default: return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium"><Clock className="w-3 h-3" />Pending</span>;
    }
  };

  const inputClass = "w-full px-3 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-ring/30";

  return (
    <LecturerLayout title="Book Recommendations" description="Recommend books for the library to acquire">
      <div className="mb-6">
        <button onClick={() => setShowForm(!showForm)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">
          <Plus className="w-4 h-4" /> New Recommendation
        </button>
      </div>

      {showForm && (
        <div className="bg-card border rounded-xl p-6 mb-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Book Title *</label>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} placeholder="Book title" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Author *</label>
              <input value={author} onChange={(e) => setAuthor(e.target.value)} className={inputClass} placeholder="Author name" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">ISBN</label>
              <input value={isbn} onChange={(e) => setIsbn(e.target.value)} className={inputClass} placeholder="Optional" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-1.5 block">Reason</label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} className={inputClass} rows={2} placeholder="Why this book should be acquired" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => createRec.mutate()} disabled={!title || !author || createRec.isPending} className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50">
              {createRec.isPending ? "Submitting..." : "Submit"}
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg border text-sm font-medium hover:bg-secondary">Cancel</button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !recommendations?.length ? (
        <div className="text-center py-20">
          <Star className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No recommendations yet.</p>
        </div>
      ) : (
        <div className="grid gap-3">
          {recommendations.map((rec: any) => (
            <div key={rec.id} className="bg-card border rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-foreground">{rec.title}</h3>
                  {statusBadge(rec.status)}
                </div>
                <p className="text-sm text-muted-foreground">by {rec.author}</p>
                {rec.reason && <p className="text-sm text-muted-foreground mt-1">{rec.reason}</p>}
                {rec.admin_notes && <p className="text-sm text-primary mt-1">Admin: {rec.admin_notes}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </LecturerLayout>
  );
};

export default LecturerRecommendations;
