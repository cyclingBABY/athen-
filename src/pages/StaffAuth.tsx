import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Loader2, ArrowLeft, Eye, EyeOff, GraduationCap } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const StaffAuth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [campus, setCampus] = useState("");
  const [department, setDepartment] = useState("");
  const [staffId, setStaffId] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pendingApproval, setPendingApproval] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, role, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user && role) {
      if (role === "admin") navigate("/dashboard", { replace: true });
      else if (role === "lecturer") navigate("/lecturer/dashboard", { replace: true });
      else navigate("/home", { replace: true });
    }
  }, [user, role, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setPendingApproval(false);

    if (isLogin) {
      const { data: signInData, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast({ title: "Login failed", description: error.message, variant: "destructive" });
        setLoading(false);
        return;
      }

      // Check approval
      const { data: profile } = await supabase
        .from("profiles")
        .select("approved")
        .eq("user_id", signInData.user.id)
        .maybeSingle();

      if (profile && !profile.approved) {
        await supabase.auth.signOut();
        setPendingApproval(true);
        setLoading(false);
        return;
      }
    } else {
      // Staff self-registration
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            account_type: "lecturer",
          },
        },
      });
      if (error) {
        toast({ title: "Registration failed", description: error.message, variant: "destructive" });
        setLoading(false);
        return;
      }

      // Update profile with staff-specific fields
      if (data.user) {
        setTimeout(async () => {
          await supabase
            .from("profiles")
            .update({
              department: department || null,
              staff_id: staffId || null,
              campus: campus || null,
            } as any)
            .eq("user_id", data.user!.id);

          // Update role to lecturer
          await supabase
            .from("user_roles")
            .update({ role: "lecturer" } as any)
            .eq("user_id", data.user!.id);
        }, 1500);
      }

      await supabase.auth.signOut();
      setPendingApproval(true);
      setLoading(false);
      return;
    }
    setLoading(false);
  };

  const inputClass =
    "w-full px-3 py-2.5 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-ring/30";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center mb-4">
            <GraduationCap className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-display font-bold">Staff Portal</h1>
          <p className="text-sm text-muted-foreground mt-1">Athena Library — Staff Access</p>
          <Link to="/" className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
            <ArrowLeft className="w-3.5 h-3.5" />Back to Home
          </Link>
        </div>

        {pendingApproval ? (
          <div className="bg-card rounded-xl border p-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto text-xl">⏳</div>
            <h2 className="text-lg font-semibold">Pending Approval</h2>
            <p className="text-sm text-muted-foreground">
              Your staff account has been created. It requires administrator approval before you can sign in. Please contact the library admin.
            </p>
            <button
              onClick={() => { setPendingApproval(false); setIsLogin(true); }}
              className="text-sm text-primary hover:underline mt-2"
            >
              Back to Sign In
            </button>
          </div>
        ) : (
          <div className="bg-card rounded-xl border p-6">
            <div className="flex mb-6 bg-secondary rounded-lg p-1">
              <button
                onClick={() => setIsLogin(true)}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${isLogin ? "bg-card shadow-sm" : "text-muted-foreground"}`}
              >
                Sign In
              </button>
              <button
                onClick={() => setIsLogin(false)}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${!isLogin ? "bg-card shadow-sm" : "text-muted-foreground"}`}
              >
                Register
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Full Name</label>
                    <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass} placeholder="Dr. Jane Doe" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Department</label>
                    <input type="text" value={department} onChange={(e) => setDepartment(e.target.value)} className={inputClass} placeholder="e.g. Computer Science" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Staff ID</label>
                    <input type="text" value={staffId} onChange={(e) => setStaffId(e.target.value)} className={inputClass} placeholder="e.g. STAFF-001" />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Campus</label>
                    <input type="text" required value={campus} onChange={(e) => setCampus(e.target.value)} className={inputClass} placeholder="e.g. Main Campus" />
                  </div>
                </>
              )}
              <div>
                <label className="text-sm font-medium mb-1.5 block">Email</label>
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} placeholder="you@university.edu" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`${inputClass} pr-10`}
                    placeholder="••••••••"
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {isLogin ? "Sign In" : "Create Staff Account"}
              </button>
              <p className="text-xs text-center text-muted-foreground mt-3">
                Student? <Link to="/auth" className="text-primary hover:underline">Use the student login</Link>
              </p>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffAuth;
