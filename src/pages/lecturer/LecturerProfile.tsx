import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import LecturerLayout from "@/components/LecturerLayout";
import LibraryIDCard from "@/components/LibraryIDCard";
import { User, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const LecturerProfile = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("");
  const [campus, setCampus] = useState("");
  const [address, setAddress] = useState("");

  const { data: profile, isLoading } = useQuery({
    queryKey: ["lecturer-profile-full", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user!.id)
        .single();
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setPhone(profile.phone || "");
      setDepartment((profile as any).department || "");
      setCampus((profile as any).campus || "");
      setAddress(profile.address || "");
    }
  }, [profile]);

  const updateProfile = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName, phone, department, campus, address } as any)
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lecturer-profile-full"] });
      toast({ title: "Profile updated" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const inputClass = "w-full px-3 py-2 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-ring/30";

  if (isLoading) {
    return (
      <LecturerLayout title="Profile">
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </LecturerLayout>
    );
  }

  return (
    <LecturerLayout title="Profile" description="Manage your personal information">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Profile Form */}
        <div className="bg-card border rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold">Personal Information</h2>
          <div className="flex items-center gap-4 mb-4">
            {profile?.photo_url ? (
              <img src={profile.photo_url} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-muted" />
            ) : (
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                <User className="w-8 h-8 text-muted-foreground" />
              </div>
            )}
            <div>
              <h3 className="font-semibold text-foreground">{profile?.full_name || "Lecturer"}</h3>
              <p className="text-sm text-muted-foreground">{profile?.email}</p>
              {(profile as any)?.library_card_number && (
                <p className="text-xs text-primary font-mono font-semibold mt-0.5">{(profile as any).library_card_number}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-1.5 block">Full Name</label>
              <input value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Phone</label>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Department</label>
              <input value={department} onChange={(e) => setDepartment(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Campus</label>
              <input value={campus} onChange={(e) => setCampus(e.target.value)} className={inputClass} />
            </div>
            <div className="md:col-span-2">
              <label className="text-sm font-medium mb-1.5 block">Address</label>
              <input value={address} onChange={(e) => setAddress(e.target.value)} className={inputClass} />
            </div>
          </div>

          <button
            onClick={() => updateProfile.mutate()}
            disabled={updateProfile.isPending}
            className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {updateProfile.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Changes
          </button>
        </div>

        {/* Printable Library ID Card */}
        {profile?.approved && (
          <div className="bg-card border rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4">My Library ID Card</h2>
            <LibraryIDCard
              fullName={profile.full_name || "Lecturer"}
              email={profile.email || ""}
              cardNumber={(profile as any).library_card_number || ""}
              role="lecturer"
              photoUrl={profile.photo_url}
              department={(profile as any).department}
              campus={(profile as any).campus}
            />
          </div>
        )}
      </div>
    </LecturerLayout>
  );
};

export default LecturerProfile;
