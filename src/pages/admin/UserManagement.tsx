import AdminLayout from "@/components/AdminLayout";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, UserPlus, Pencil, CheckCircle, XCircle, Shield, Trash2 } from "lucide-react";
import { useState } from "react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const getRoleLabel = (role: string) => {
  switch (role) {
    case "admin": return "Admin";
    case "lecturer": return "Lecturer";
    case "registrar": return "Registrar";
    case "staff": return "Library Staff";
    case "patron": return "Student";
    default: return role ? role.charAt(0).toUpperCase() + role.slice(1) : "Student";
  }
};

const getRoleBadgeVariant = (role: string): "default" | "secondary" | "outline" | "destructive" => {
  switch (role) {
    case "admin": return "default";
    case "registrar": return "outline";
    case "staff": return "secondary";
    case "lecturer": return "secondary";
    default: return "secondary";
  }
};

const UserManagement = () => {
  const [search, setSearch] = useState("");
  const [editProfile, setEditProfile] = useState<any>(null);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", address: "", role: "patron", password: "" });
  const [addForm, setAddForm] = useState({ full_name: "", email: "", password: "", phone: "", role: "patron" });
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: profiles, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      const { data: roles } = await supabase.from("user_roles").select("user_id, role");
      return data.map(p => ({
        ...p,
        role: roles?.find(r => r.user_id === p.user_id)?.role || "patron",
      }));
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (profile: any) => {
      const { error: profileError } = await supabase.from("profiles").update({
        full_name: profile.full_name,
        phone: profile.phone,
        address: profile.address,
      }).eq("id", editProfile.id);
      if (profileError) throw profileError;

      const { error: roleError } = await supabase.from("user_roles").update({
        role: profile.role
      } as any).eq("user_id", editProfile.user_id);
      if (roleError) throw roleError;

      if (profile.password && profile.password.trim().length >= 6) {
        const { error: pwdError } = await (supabase.auth as any).changePassword({
          userId: editProfile.user_id,
          password: profile.password.trim()
        });
        if (pwdError) throw pwdError;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: "User updated successfully" });
      setEditProfile(null);
    },
    onError: (e: any) => toast({ title: "Error updating user", description: e.message, variant: "destructive" }),
  });

  const approveMutation = useMutation({
    mutationFn: async ({ userId, approve }: { userId: string; approve: boolean }) => {
      const { error } = await supabase.from("profiles").update({ approved: approve } as any).eq("user_id", userId);
      if (error) throw error;
    },
    onSuccess: (_, { approve }) => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: approve ? "User approved" : "User suspended" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const addUserMutation = useMutation({
    mutationFn: async (u: typeof addForm) => {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: u.email,
        password: u.password,
        options: { data: { full_name: u.full_name, account_type: u.role } },
      });
      if (signUpError) throw signUpError;

      const newUserId = signUpData.user?.id;
      if (!newUserId) throw new Error("User creation failed");

      await supabase.from("profiles").update({ approved: true, phone: u.phone || null } as any).eq("user_id", newUserId);
      await supabase.from("user_roles").update({ role: u.role } as any).eq("user_id", newUserId);

      // Send invitation email with login credentials
      await supabase.functions.invoke("send-user-invite", {
        body: {
          email: u.email,
          fullName: u.full_name,
          password: u.password,
          role: u.role,
        },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast({ title: "User added", description: "Account created and invitation email sent." });
      setAddDialogOpen(false);
      setAddForm({ full_name: "", email: "", password: "", phone: "", role: "patron" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const openEdit = (p: any) => {
    setEditProfile(p);
    setForm({
      full_name: p.full_name || "",
      email: p.email || "",
      phone: p.phone || "",
      address: p.address || "",
      role: p.role || "patron",
      password: "",
    });
  };

  const filtered = profiles?.filter(p =>
    (p.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.email || "").toLowerCase().includes(search.toLowerCase())
  );

  const pendingCount = profiles?.filter(p => !(p as any).approved).length || 0;

  return (
    <AdminLayout title="User Management" description="Add, approve, and manage all library users">
      <div className="flex items-center justify-between gap-4 mb-4 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by name or email…" className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-2 items-center">
          {pendingCount > 0 && (
            <Badge variant="destructive" className="text-xs">{pendingCount} pending approval</Badge>
          )}
          <Button onClick={() => setAddDialogOpen(true)}><UserPlus className="w-4 h-4 mr-2" />Add User</Button>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Loading…</TableCell></TableRow>
            ) : filtered?.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No users found</TableCell></TableRow>
            ) : filtered?.map(p => (
              <TableRow key={p.id} className={!(p as any).approved ? "bg-amber-50/50 dark:bg-amber-950/10" : ""}>
                <TableCell className="font-medium">{p.full_name || "—"}</TableCell>
                <TableCell>{p.email || "—"}</TableCell>
                <TableCell>
                  <Badge variant={getRoleBadgeVariant((p as any).role)}>
                    {getRoleLabel((p as any).role)}
                  </Badge>
                </TableCell>
                <TableCell>
                  {(p as any).approved ? (
                    <Badge variant="outline" className="text-green-600 border-green-300">Approved</Badge>
                  ) : (
                    <Badge variant="destructive">Pending</Badge>
                  )}
                </TableCell>
                <TableCell>{p.phone || "—"}</TableCell>
                <TableCell className="text-sm">{format(new Date(p.created_at), "MMM d, yyyy")}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {!(p as any).approved && (
                      <Button variant="ghost" size="sm" className="text-green-600" onClick={() => approveMutation.mutate({ userId: p.user_id, approve: true })} title="Approve">
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                    )}
                    {(p as any).approved && (
                      <Button variant="ghost" size="sm" className="text-amber-600" onClick={() => approveMutation.mutate({ userId: p.user_id, approve: false })} title="Suspend">
                        <XCircle className="w-4 h-4" />
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" onClick={() => openEdit(p)} title="Edit"><Pencil className="w-3.5 h-3.5" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editProfile} onOpenChange={() => setEditProfile(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>Update user profile information and access role.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div><Label>Full Name</Label><Input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} /></div>
            <div><Label>Email</Label><Input value={form.email} disabled className="bg-muted" /></div>
            <div><Label>Phone</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
            <div><Label>Address</Label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>
            <div>
              <Label>Role</Label>
              <Select value={form.role} onValueChange={v => setForm({ ...form, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="patron">Student (Patron)</SelectItem>
                  <SelectItem value="lecturer">Lecturer</SelectItem>
                  <SelectItem value="registrar">Registrar</SelectItem>
                  <SelectItem value="staff">Library Staff</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Reset Password</Label>
              <Input
                type="password"
                placeholder="Leave blank to keep current password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
              />
              <p className="text-[11px] text-muted-foreground mt-0.5">Min 6 characters. Will update immediately on save.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditProfile(null)}>Cancel</Button>
            <Button onClick={() => updateMutation.mutate(form)} disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Saving…" : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add User Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>Create a new user account. They will be approved automatically.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div><Label>Full Name *</Label><Input value={addForm.full_name} onChange={e => setAddForm({ ...addForm, full_name: e.target.value })} /></div>
            <div><Label>Email *</Label><Input type="email" value={addForm.email} onChange={e => setAddForm({ ...addForm, email: e.target.value })} /></div>
            <div><Label>Password *</Label><Input type="password" value={addForm.password} onChange={e => setAddForm({ ...addForm, password: e.target.value })} placeholder="Min 6 characters" /></div>
            <div><Label>Phone</Label><Input value={addForm.phone} onChange={e => setAddForm({ ...addForm, phone: e.target.value })} /></div>
            <div>
              <Label>Role</Label>
              <Select value={addForm.role} onValueChange={v => setAddForm({ ...addForm, role: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="patron">Student (Patron)</SelectItem>
                  <SelectItem value="lecturer">Lecturer</SelectItem>
                  <SelectItem value="registrar">Registrar</SelectItem>
                  <SelectItem value="staff">Library Staff</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={() => addUserMutation.mutate(addForm)}
              disabled={!addForm.full_name || !addForm.email || addForm.password.length < 6 || addUserMutation.isPending}
            >
              {addUserMutation.isPending ? "Creating…" : "Add User"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default UserManagement;
