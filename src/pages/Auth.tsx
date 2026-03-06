import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingApproval, setPendingApproval] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, role, loading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading && user && role) {
      navigate(role === "admin" ? "/dashboard" : "/home", { replace: true });
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

      // Check if user is approved
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
      // Navigation handled by useEffect
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName, account_type: "patron" } },
      });
      if (error) {
        toast({ title: "Registration failed", description: error.message, variant: "destructive" });
        setLoading(false);
      } else {
        // Sign out immediately — they need approval
        await supabase.auth.signOut();
        setPendingApproval(true);
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center mb-4">
            <BookOpen className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-display font-bold">Athena</h1>
          <p className="text-sm text-muted-foreground mt-1">Library Management System</p>
        </div>

        {pendingApproval ? (
          <div className="bg-card rounded-xl border p-6 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto text-xl">⏳</div>
            <h2 className="text-lg font-semibold">Pending Approval</h2>
            <p className="text-sm text-muted-foreground">
              Your account has been created but requires administrator approval before you can sign in. Please contact your librarian.
            </p>
            <button
              onClick={() => setPendingApproval(false)}
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
                <div>
                  <label className="text-sm font-medium mb-1.5 block">Full Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-ring/30"
                    placeholder="Your full name"
                  />
                </div>
              )}
              <div>
                <label className="text-sm font-medium mb-1.5 block">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-ring/30"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Password</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-ring/30"
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {isLogin ? "Sign In" : "Create Account"}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Auth;
