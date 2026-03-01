import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import PatronSidebar from "@/components/PatronSidebar";
import { Badge } from "@/components/ui/badge";
import { BookCopy, RefreshCw } from "lucide-react";

const PatronMyBooks = () => {
  const [records, setRecords] = useState<any[]>([]);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchRecords = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("circulation_records")
      .select("*, books(title, author, cover_color)")
      .eq("user_id", user.id)
      .order("checkout_date", { ascending: false });
    if (data) setRecords(data);
  };

  useEffect(() => { fetchRecords(); }, [user]);

  const handleRenew = async (id: string, currentCount: number) => {
    if (currentCount >= 2) {
      toast({ title: "Cannot renew", description: "Maximum renewals reached (2).", variant: "destructive" });
      return;
    }
    const newDue = new Date();
    newDue.setDate(newDue.getDate() + 14);
    const { error } = await supabase
      .from("circulation_records")
      .update({ due_date: newDue.toISOString(), renewed_count: currentCount + 1 })
      .eq("id", id);
    if (error) {
      toast({ title: "Renewal failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Book renewed!", description: `New due date: ${newDue.toLocaleDateString()}` });
      fetchRecords();
    }
  };

  const active = records.filter((r) => r.status !== "returned");
  const history = records.filter((r) => r.status === "returned");

  return (
    <div className="flex min-h-screen bg-background">
      <PatronSidebar />
      <main className="flex-1 p-6 overflow-auto">
        <h1 className="text-2xl font-display font-bold mb-6">My Books</h1>

        <div className="bg-card rounded-xl border mb-6">
          <div className="p-5 border-b">
            <h2 className="text-lg font-display font-semibold">Currently Borrowed</h2>
          </div>
          {active.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <BookCopy className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p>No books currently borrowed</p>
            </div>
          ) : (
            <div className="divide-y">
              {active.map((r) => (
                <div key={r.id} className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-11 rounded-sm shadow-sm" style={{ backgroundColor: r.books?.cover_color || "hsl(210 60% 50%)" }} />
                    <div>
                      <p className="font-medium text-sm">{r.books?.title}</p>
                      <p className="text-xs text-muted-foreground">Due: {new Date(r.due_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className={`text-xs capitalize ${r.status === "overdue" ? "bg-destructive/10 text-destructive border-destructive/20" : "bg-info/10 text-info border-info/20"}`}>
                      {r.status.replace("-", " ")}
                    </Badge>
                    <button onClick={() => handleRenew(r.id, r.renewed_count)} className="flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                      <RefreshCw className="w-3.5 h-3.5" /> Renew
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {history.length > 0 && (
          <div className="bg-card rounded-xl border">
            <div className="p-5 border-b">
              <h2 className="text-lg font-display font-semibold">Borrowing History</h2>
            </div>
            <div className="divide-y">
              {history.map((r) => (
                <div key={r.id} className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-11 rounded-sm shadow-sm" style={{ backgroundColor: r.books?.cover_color || "hsl(210 60% 50%)" }} />
                    <div>
                      <p className="font-medium text-sm">{r.books?.title}</p>
                      <p className="text-xs text-muted-foreground">Returned: {new Date(r.return_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-xs bg-success/10 text-success border-success/20">Returned</Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default PatronMyBooks;
