import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import AdminLayout from "@/components/AdminLayout";
import { useToast } from "@/hooks/use-toast";
import { GraduationCap, Plus, Loader2, Mail, CheckCircle, XCircle, Clock } from "lucide-react";

const LecturerManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [department, setDepartment] = useState("");
  const [staffId, setStaffId] = useState("");
  const [creating, setCreating] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("all");

  const { data: lecturers, isLoading } = useQuery({
    queryKey: ["admin-lecturers"],
    queryFn: async () => {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "lecturer");
      if (!roles?.length) return [];
      const userIds = roles.map(r => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("*")
        .in("user_id", userIds)
        .order("created_at", { ascending: false });
      return profiles ?? [];
    },
  });

  const approveMutation = useMutation({
    mutationFn: async ({ userId, approve }: { userId: string; approve: boolean }) => {
      const { error } = await supabase
        .from("profiles")
        .update({ approved: approve })
        .eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: (_, { approve }) => {
      queryClient.invalidateQueries({ queryKey: ["admin-lecturers"] });
      toast({ title: approve ? "Lecturer approved" : "Lecturer rejected", description: approve ? "They can now sign in." : "Access has been revoked." });
    },
    onError: (e: any) => {
      toast({ title: "Action failed", description: e.message, variant: "destructive" });
    },
  });

  const handleCreate = async () => {
    if (!email) return;
    setCreating(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-lecturer", {
        body: { email, fullName, department, staffId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "Lecturer account created", description: "An invitation email has been sent." });
      setShowForm(false);
      setEmail(""); setFullName(""); setDepartment(""); setStaffId("");
      queryClient.invalidateQueries({ queryKey: ["admin-lecturers"] });
    } catch (e: any) {
      toast({ title: "Failed to create lecturer", description: e.message, variant: "destructive" });
    }
    setCreating(false);
  };

  const filtered = lecturers?.filter((l: any) => {
    if (filter === "pending") return !l.approved;
    if (filter === "approved") return l.approved;
    return true;
  });

  const pendingCount = lecturers?.filter((l: any) => !l.approved).length ?? 0;

  const inputClass = "w-full px-3 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-ring/30";

  return (
    <AdminLayout title="Lecturer Management" description="Approve and manage lecturer accounts">
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <button onClick={() => setShowForm(!showForm)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90">
          <Plus className="w-4 h-4" /> Add Lecturer
        </button>

        <div className="flex bg-secondary rounded-lg p-1 text-sm">
          {(["all", "pending", "approved"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-md font-medium capitalize transition-colors ${filter === f ? "bg-card shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              {f}{f === "pending" && pendingCount > 0 && <span className="ml-1.5 bg-destructive text-destructive-foreground text-xs px-1.5 py-0.5 rounded-full">{pendingCount}</span>}
            </button>
          ))}
        </div>
      </div>

      {showForm && (
        <div className="bg-card border rounded-xl p-6 mb-6 space-y-4">
          <h3 className="font-semibold text-foreground">Create Lecturer Account</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Email *</label>
              <input value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="lecturer@university.edu" type="email" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Full Name</label>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} placeholder="Dr. John Doe" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Department</label>
              <input value={department} onChange={(e) => setDepartment(e.target.value)} className={inputClass} placeholder="Computer Science" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Staff ID</label>
              <input value={staffId} onChange={(e) => setStaffId(e.target.value)} className={inputClass} placeholder="STAFF-001" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">An invitation email with a temporary password will be sent to the lecturer.</p>
          <div className="flex gap-2">
            <button onClick={handleCreate} disabled={!email || creating} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50">
              {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              {creating ? "Creating..." : "Create & Send Invite"}
            </button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg border text-sm font-medium hover:bg-secondary">Cancel</button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : !filtered?.length ? (
        <div className="text-center py-20">
          <GraduationCap className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">
            {filter === "pending" ? "No pending approvals." : filter === "approved" ? "No approved lecturers yet." : "No lecturers yet. Add one to get started."}
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filtered.map((l: any) => (
            <div key={l.id} className="bg-card border rounded-xl p-4 flex items-center gap-4">
              {l.photo_url ? (
                <img src={l.photo_url} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-muted" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-lg text-muted-foreground">
                  {l.full_name?.[0]?.toUpperCase() || "L"}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-foreground truncate">{l.full_name || "No name"}</h3>
                <p className="text-sm text-muted-foreground">{l.email}</p>
                <div className="flex flex-wrap gap-2 mt-1">
                  {l.department && <span className="text-xs bg-secondary px-2 py-0.5 rounded-full text-muted-foreground">{l.department}</span>}
                  {l.staff_id && <span className="text-xs bg-secondary px-2 py-0.5 rounded-full text-muted-foreground font-mono">{l.staff_id}</span>}
                  {l.campus && <span className="text-xs bg-secondary px-2 py-0.5 rounded-full text-muted-foreground">{l.campus}</span>}
                  {l.library_card_number && <span className="text-xs bg-secondary px-2 py-0.5 rounded-full text-muted-foreground font-mono">{l.library_card_number}</span>}
                </div>
              </div>

              {l.approved ? (
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" /> Approved
                  </span>
                  <button
                    onClick={() => approveMutation.mutate({ userId: l.user_id, approve: false })}
                    disabled={approveMutation.isPending}
                    className="text-xs px-3 py-1.5 rounded-lg border text-destructive hover:bg-destructive/10 font-medium transition-colors"
                  >
                    Revoke
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-xs bg-amber-500/10 text-amber-600 px-2.5 py-1 rounded-full font-medium flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Pending
                  </span>
                  <button
                    onClick={() => approveMutation.mutate({ userId: l.user_id, approve: true })}
                    disabled={approveMutation.isPending}
                    className="text-xs px-3 py-1.5 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => approveMutation.mutate({ userId: l.user_id, approve: false })}
                    disabled={approveMutation.isPending}
                    className="text-xs px-3 py-1.5 rounded-lg border text-destructive hover:bg-destructive/10 font-medium transition-colors"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </AdminLayout>
  );
};

export default LecturerManagement;
