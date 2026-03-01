import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import PatronSidebar from "@/components/PatronSidebar";
import { Loader2 } from "lucide-react";

const PatronProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("user_id", user.id).single().then(({ data }) => {
      if (data) {
        setProfile(data);
        setFullName(data.full_name || "");
        setPhone(data.phone || "");
        setAddress(data.address || "");
      }
      setLoading(false);
    });
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, phone, address })
      .eq("user_id", user!.id);
    if (error) {
      toast({ title: "Failed to update", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile updated!" });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-background">
        <PatronSidebar />
        <main className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <PatronSidebar />
      <main className="flex-1 p-6 overflow-auto">
        <h1 className="text-2xl font-display font-bold mb-6">My Profile</h1>

        <div className="bg-card rounded-xl border p-6 max-w-lg">
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Email</label>
              <input type="email" value={profile?.email || ""} disabled className="w-full px-3 py-2.5 text-sm rounded-lg border bg-muted cursor-not-allowed" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Full Name</label>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full px-3 py-2.5 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-ring/30" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Phone</label>
              <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full px-3 py-2.5 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-ring/30" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Address</label>
              <textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={3} className="w-full px-3 py-2.5 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-ring/30" />
            </div>
            <button type="submit" disabled={saving} className="px-6 py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center gap-2">
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Changes
            </button>
          </form>
        </div>
      </main>
    </div>
  );
};

export default PatronProfile;
