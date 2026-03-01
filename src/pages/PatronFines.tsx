import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import PatronSidebar from "@/components/PatronSidebar";
import { Badge } from "@/components/ui/badge";
import { DollarSign } from "lucide-react";

const PatronFines = () => {
  const [fines, setFines] = useState<any[]>([]);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    const fetchFines = async () => {
      const { data } = await supabase
        .from("fines")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (data) setFines(data);
    };
    fetchFines();
  }, [user]);

  const unpaid = fines.filter((f) => !f.paid);
  const paid = fines.filter((f) => f.paid);
  const totalOwed = unpaid.reduce((sum, f) => sum + Number(f.amount), 0);

  return (
    <div className="flex min-h-screen bg-background">
      <PatronSidebar />
      <main className="flex-1 p-6 overflow-auto">
        <h1 className="text-2xl font-display font-bold mb-6">Fines & Fees</h1>

        {totalOwed > 0 && (
          <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-5 mb-6">
            <p className="text-sm font-medium text-destructive">Outstanding Balance</p>
            <p className="text-3xl font-display font-bold text-destructive mt-1">${totalOwed.toFixed(2)}</p>
          </div>
        )}

        <div className="bg-card rounded-xl border">
          {fines.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <DollarSign className="w-10 h-10 mx-auto mb-2 opacity-40" />
              <p>No fines — you're all clear!</p>
            </div>
          ) : (
            <div className="divide-y">
              {fines.map((f) => (
                <div key={f.id} className="flex items-center justify-between px-5 py-4">
                  <div>
                    <p className="font-medium text-sm">{f.reason || "Late return fee"}</p>
                    <p className="text-xs text-muted-foreground">{new Date(f.created_at).toLocaleDateString()}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-sm">${Number(f.amount).toFixed(2)}</span>
                    <Badge variant="outline" className={`text-xs ${f.paid ? "bg-success/10 text-success border-success/20" : "bg-destructive/10 text-destructive border-destructive/20"}`}>
                      {f.paid ? "Paid" : "Unpaid"}
                    </Badge>
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

export default PatronFines;
