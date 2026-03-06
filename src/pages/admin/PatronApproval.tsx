import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import AppSidebar from "@/components/AppSidebar";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle, UserCheck, Clock, Search } from "lucide-react";

interface PendingUser {
  id: string;
  user_id: string;
  full_name: string | null;
  email: string | null;
  registration_number: string | null;
  photo_url: string | null;
  approved: boolean;
  created_at: string;
}

const PatronApproval = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<PendingUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "approved" | "all">("pending");
  const [search, setSearch] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchUsers = async () => {
    let query = supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (filter === "pending") query = query.eq("approved", false);
    if (filter === "approved") query = query.eq("approved", true);
    const { data, error } = await query;
    if (error) {
      toast({ title: "Error loading users", description: error.message, variant: "destructive" });
    } else {
      setUsers((data as any[]) || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    fetchUsers();
  }, [filter]);

  const handleApprove = async (userId: string) => {
    setActionLoading(userId);
    const user = users.find((u) => u.user_id === userId);
    const { error } = await supabase.from("profiles").update({ approved: true }).eq("user_id", userId);
    if (error) {
      toast({ title: "Approval failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Patron approved!", description: "They can now sign in to the system." });
      setUsers((prev) => prev.map((u) => (u.user_id === userId ? { ...u, approved: true } : u)));

      // Send approval notification email
      try {
        await supabase.functions.invoke("send-approval-email", {
          body: { email: user?.email, fullName: user?.full_name },
        });
      } catch (e) {
        console.error("Failed to send approval email:", e);
      }
    }
    setActionLoading(null);
  };

  const handleReject = async (userId: string) => {
    setActionLoading(userId);
    const { error } = await supabase.from("profiles").update({ approved: false }).eq("user_id", userId);
    if (error) {
      toast({ title: "Action failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Patron access revoked." });
      setUsers((prev) => prev.map((u) => (u.user_id === userId ? { ...u, approved: false } : u)));
    }
    setActionLoading(null);
  };

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      (u.full_name?.toLowerCase().includes(q) || "") ||
      (u.email?.toLowerCase().includes(q) || "") ||
      ((u as any).registration_number?.toLowerCase().includes(q) || "")
    );
  });

  const pendingCount = users.filter((u) => !u.approved).length;

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="flex-1 p-6 overflow-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold">Patron Approval</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Review and approve new patron registrations
            </p>
          </div>
          {pendingCount > 0 && filter !== "pending" && (
            <button
              onClick={() => setFilter("pending")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-100 text-amber-800 text-sm font-medium"
            >
              <Clock className="w-4 h-4" />
              {pendingCount} Pending
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex bg-secondary rounded-lg p-1">
            {(["pending", "approved", "all"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors capitalize ${
                  filter === f ? "bg-card shadow-sm" : "text-muted-foreground"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, reg no..."
              className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-20">
            <UserCheck className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">
              {filter === "pending" ? "No pending registrations" : "No patrons found"}
            </p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredUsers.map((user) => (
              <div
                key={user.id}
                className="bg-card rounded-xl border p-4 flex items-center gap-4 hover:shadow-sm transition-shadow"
              >
                {/* Photo */}
                {(user as any).photo_url ? (
                  <img
                    src={(user as any).photo_url}
                    alt={user.full_name || ""}
                    className="w-14 h-14 rounded-full object-cover border-2 border-muted"
                  />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center text-xl text-muted-foreground">
                    {user.full_name?.[0]?.toUpperCase() || "?"}
                  </div>
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold truncate">{user.full_name || "No name"}</h3>
                    {user.approved ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">
                        <CheckCircle className="w-3 h-3" /> Approved
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
                        <Clock className="w-3 h-3" /> Pending
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                  {(user as any).registration_number && (
                    <p className="text-xs text-muted-foreground font-mono mt-0.5">
                      Reg: {(user as any).registration_number}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Registered: {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                  {!user.approved ? (
                    <button
                      onClick={() => handleApprove(user.user_id)}
                      disabled={actionLoading === user.user_id}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {actionLoading === user.user_id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                      Approve
                    </button>
                  ) : (
                    <button
                      onClick={() => handleReject(user.user_id)}
                      disabled={actionLoading === user.user_id}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border text-sm font-medium text-destructive hover:bg-destructive/5 transition-colors disabled:opacity-50"
                    >
                      {actionLoading === user.user_id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                      Revoke
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default PatronApproval;
