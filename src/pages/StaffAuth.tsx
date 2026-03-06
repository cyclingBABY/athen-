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
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, role, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user && role) {
      if (role === "admin") navigate("/dashboard", { replace: true });
      else if (role === "lecturer") navigate("/lecturer/dashboard", { replace: true });
      else {
        // Patron trying to use staff login — redirect to patron home
        navigate("/home", { replace: true });
      }
    }
  }, [user, role, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setPendingMessage(null);

    if (isLogin) {
      const { data: signInData, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast({ title: "Login failed", description: error.message, variant: "destructive" });
        setLoading(false);
        return;
      }

      // Check if user is actually a staff member (admin or lecturer)
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", signInData.user.id)
        .maybeSingle();

      if (roleData?.role !== "admin" && roleData?.role !== "lecturer") {
        await supabase.auth.signOut();
        toast({ title: "Access denied", description: "This login is for staff members only. Please use the regular login.", variant: "destructive" });
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
        setPendingMessage("Your account is pending approval. Please contact the library administrator.");
        setLoading(false);
        return;
      }
    } else {
      // Staff registration — they provide their info, admin creates the actual account
      // For now, show a message that staff accounts are created by admin
      setPendingMessage("Staff accounts are created by the library administrator. Please contact your admin to have your lecturer account set up. They will send you login credentials.");
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
          <p className="text-sm text-muted-foreground mt-1">Athena Library — Staff Login</p>
          <Link to="/" className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary hover:underline">
            <ArrowLeft className="w-3.5 h-3.5" />Back to Home
          </Link>
        </div>

        {pendingMessage ? (
          <div className="bg-card rounded-xl border p-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto text-xl">
              {isLogin ? "⏳" : "📋"}
            </div>
            <h2 className="text-lg font-semibold">{isLogin ? "Pending Approval" : "Contact Admin"}</h2>
            <p className="text-sm text-muted-foreground">{pendingMessage}</p>
            <button
              onClick={() => { setPendingMessage(null); setIsLogin(true); }}
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
                Request Access
              </button>
            </div>

            {isLogin ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={inputClass}
                    placeholder="you@university.edu"
                  />
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
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
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
                  Sign In
                </button>
                <p className="text-xs text-center text-muted-foreground mt-3">
                  Student? <Link to="/auth" className="text-primary hover:underline">Use the regular login</Link>
                </p>
              </form>
            ) : (
              <div className="space-y-4 text-center py-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
                  <GraduationCap className="w-8 h-8" />
                </div>
                <h3 className="font-semibold text-foreground">Staff Account Setup</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Staff and lecturer accounts are created by the library administrator. Please contact your library admin with your details:
                </p>
                <ul className="text-sm text-muted-foreground space-y-1 text-left max-w-xs mx-auto">
                  <li>• Full name</li>
                  <li>• University email</li>
                  <li>• Department</li>
                  <li>• Staff ID number</li>
                </ul>
                <p className="text-sm text-muted-foreground">
                  Once your account is created, you'll receive an email with login credentials.
                </p>
                <button
                  onClick={() => setIsLogin(true)}
                  className="text-sm text-primary hover:underline"
                >
                  Already have an account? Sign in
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffAuth;
