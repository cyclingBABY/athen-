import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { BookOpen, Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast({ title: "Login failed", description: error.message, variant: "destructive" });
      } else {
        navigate("/dashboard");
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: fullName }, emailRedirectTo: window.location.origin },
      });
      if (error) {
        toast({ title: "Registration failed", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Check your email", description: "We sent a verification link to confirm your account." });
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-xl bg-primary flex items-center justify-center mb-4">
            <BookOpen className="w-7 h-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-display font-bold">Athenaeum</h1>
          <p className="text-sm text-muted-foreground mt-1">Library Management System</p>
        </div>

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

          <div className="mt-6 pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground text-center mb-3">Quick Demo Login</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={async () => {
                  setLoading(true);
                  // Try login first, if fails then register and login
                  const { error: loginErr } = await supabase.auth.signInWithPassword({ email: "admin@athenaeum.com", password: "admin123" });
                  if (loginErr) {
                    await supabase.auth.signUp({ email: "admin@athenaeum.com", password: "admin123", options: { data: { full_name: "Admin User" } } });
                    const { error } = await supabase.auth.signInWithPassword({ email: "admin@athenaeum.com", password: "admin123" });
                    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); setLoading(false); return; }
                  }
                  navigate("/");
                  setLoading(false);
                }}
                className="py-2 text-xs rounded-lg border bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
              >
                Login as Admin
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={async () => {
                  setLoading(true);
                  const { error: loginErr } = await supabase.auth.signInWithPassword({ email: "patron@athenaeum.com", password: "patron123" });
                  if (loginErr) {
                    await supabase.auth.signUp({ email: "patron@athenaeum.com", password: "patron123", options: { data: { full_name: "Demo Patron" } } });
                    const { error } = await supabase.auth.signInWithPassword({ email: "patron@athenaeum.com", password: "patron123" });
                    if (error) { toast({ title: "Failed", description: error.message, variant: "destructive" }); setLoading(false); return; }
                  }
                  navigate("/");
                  setLoading(false);
                }}
                className="py-2 text-xs rounded-lg border bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
              >
                Login as Patron
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth;
