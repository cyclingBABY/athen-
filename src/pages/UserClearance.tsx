import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import UserSidebar from "@/components/UserSidebar";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertTriangle, Book, DollarSign, HelpCircle, FileText } from "lucide-react";
import { format } from "date-fns";

const UserClearance = () => {
  const [unreturnedBooks, setUnreturnedBooks] = useState<any[]>([]);
  const [unpaidFines, setUnpaidFines] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchClearanceStatus = async () => {
    if (!user) return;
    setIsLoading(true);

    // 1. Fetch unreturned books
    const { data: booksData } = await supabase
      .from("circulation_records")
      .select("*, books(title, author)")
      .eq("user_id", user.id)
      .neq("status", "returned");

    // 2. Fetch unpaid fines
    const { data: finesData } = await supabase
      .from("fines")
      .select("*")
      .eq("user_id", user.id)
      .eq("paid", false);

    if (booksData) setUnreturnedBooks(booksData);
    if (finesData) setUnpaidFines(finesData);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchClearanceStatus();
  }, [user]);

  const totalFines = unpaidFines.reduce((sum, f) => sum + Number(f.amount), 0);
  const isCleared = unreturnedBooks.length === 0 && totalFines === 0;

  return (
    <div className="flex min-h-screen bg-background">
      <UserSidebar />
      <main className="flex-1 p-6 overflow-auto">
        <h1 className="text-2xl font-display font-bold mb-2">Academic Clearance Status</h1>
        <p className="text-sm text-muted-foreground mb-6">View your real-time library clearance status for exams, graduation, and document issuance.</p>

        {isLoading ? (
          <div className="bg-card rounded-xl border p-12 text-center text-muted-foreground">
            <HelpCircle className="w-12 h-12 mx-auto mb-3 opacity-30 animate-bounce" />
            <p>Verifying clearance requirements...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Status Card */}
            <div className={`p-6 rounded-xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
              isCleared ? "bg-emerald-500/10 border-emerald-500/20" : "bg-rose-500/10 border-rose-500/20"
            }`}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${
                  isCleared ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                }`}>
                  {isCleared ? <CheckCircle className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
                </div>
                <div>
                  <h2 className="text-lg font-semibold font-display">
                    {isCleared ? "Status: CLEARED" : "Status: FLAGGED (NOT CLEARED)"}
                  </h2>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isCleared 
                      ? "You have resolved all library obligations. You are fully cleared." 
                      : "You have unresolved library obligations that are blocking your academic actions."}
                  </p>
                </div>
              </div>
              <Badge variant={isCleared ? "secondary" : "destructive"} className="text-sm px-3 py-1 uppercase">
                {isCleared ? "Cleared" : "Flagged"}
              </Badge>
            </div>

            {/* Academic Clearance Restrictions Alert */}
            {!isCleared && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-sm flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="font-semibold text-amber-800 dark:text-amber-400">Academic Restrictions Enforced</p>
                  <p className="text-xs text-muted-foreground">
                    Due to unreturned items or unpaid fines, you are currently **blocked** from accessing examinations, requesting letters of recommendation, and final graduation clearance. Please resolve the issues listed below to restore full clearance.
                  </p>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Unreturned Books list */}
              <div className="bg-card rounded-xl border overflow-hidden">
                <div className="p-4 border-b flex items-center gap-2 bg-muted/30">
                  <Book className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-sm">Unreturned Books ({unreturnedBooks.length})</h3>
                </div>
                {unreturnedBooks.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground text-xs">
                    No unreturned books.
                  </div>
                ) : (
                  <div className="divide-y text-sm">
                    {unreturnedBooks.map((r) => (
                      <div key={r.id} className="p-4 flex items-center justify-between">
                        <div>
                          <p className="font-medium">{r.books?.title}</p>
                          <p className="text-xs text-muted-foreground">Due Date: {r.due_date ? format(new Date(r.due_date), "MMM d, yyyy") : "—"}</p>
                        </div>
                        <Badge variant="outline" className="text-xs bg-rose-500/10 text-rose-500 border-rose-500/20 shrink-0">
                          Unreturned
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Unpaid Fines list */}
              <div className="bg-card rounded-xl border overflow-hidden">
                <div className="p-4 border-b flex items-center gap-2 bg-muted/30">
                  <DollarSign className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-sm">Unpaid Fines (${totalFines.toFixed(2)})</h3>
                </div>
                {unpaidFines.length === 0 ? (
                  <div className="p-6 text-center text-muted-foreground text-xs">
                    No unpaid fines.
                  </div>
                ) : (
                  <div className="divide-y text-sm">
                    {unpaidFines.map((f) => (
                      <div key={f.id} className="p-4 flex items-center justify-between">
                        <div>
                          <p className="font-medium">{f.reason || "Late return fine"}</p>
                          <p className="text-xs text-muted-foreground">Assessed on {format(new Date(f.created_at), "MMM d, yyyy")}</p>
                        </div>
                        <span className="font-semibold text-rose-600 dark:text-rose-400">
                          ${Number(f.amount).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Clearance slip preview if cleared */}
            {isCleared && (
              <div className="bg-card rounded-xl border p-6 text-center max-w-md mx-auto space-y-4">
                <FileText className="w-12 h-12 text-primary mx-auto opacity-70" />
                <div>
                  <h3 className="font-semibold">Library Clearance Slip</h3>
                  <p className="text-xs text-muted-foreground mt-1">This document confirms you have no active library liabilities. Use this for Registrar clearance.</p>
                </div>
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-semibold rounded-lg shadow-sm transition-colors w-full"
                >
                  Print Clearance Slip
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default UserClearance;
