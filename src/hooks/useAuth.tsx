import { useState, useEffect, createContext, useContext, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

type LocalUser = {
  id: string;
  email?: string;
  [key: string]: unknown;
};

interface AuthContext {
  user: LocalUser | null;
  role: "admin" | "patron" | "lecturer" | "registrar" | "staff" | null;
  loading: boolean;
  loginLocalContext: (user: LocalUser, token: string, role: "admin" | "patron" | "lecturer" | "registrar" | "staff") => void;
  signOut: () => Promise<void>;
}

const AuthCtx = createContext<AuthContext>({
  user: null,
  role: null,
  loading: true,
  loginLocalContext: () => {},
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<LocalUser | null>(null);
  const [role, setRole] = useState<"admin" | "patron" | "lecturer" | "registrar" | "staff" | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle();
      if (error) {
        console.error("Error fetching role:", error);
        setRole("patron");
      } else {
        setRole((data?.role as "admin" | "patron" | "lecturer" | "registrar" | "staff") ?? "patron");
      }
    } catch (e) {
      console.error("Role fetch exception:", e);
      setRole("patron");
    }
  };

  useEffect(() => {
    // Get initial session first
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        await fetchRole(u.id);
      } else {
        setRole(null);
      }
      setLoading(false);
    });

    // Then listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        // Use setTimeout to avoid blocking the auth state change callback
        setTimeout(async () => {
          await fetchRole(u.id);
          setLoading(false);
        }, 0);
      } else {
        setRole(null);
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loginLocalContext = (user: LocalUser, token: string, role: "admin" | "patron" | "lecturer" | "registrar" | "staff") => {
    localStorage.setItem("athena_token", token);
    localStorage.setItem("athena_user", JSON.stringify(user));
    setUser(user);
    setRole(role);
    setLoading(false);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
  };

  return <AuthCtx.Provider value={{ user, role, loading, loginLocalContext, signOut }}>{children}</AuthCtx.Provider>;
};

export const useAuth = () => useContext(AuthCtx);
