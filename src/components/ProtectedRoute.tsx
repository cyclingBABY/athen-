import { Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface Props {
  children: React.ReactNode;
  requiredRole?: "admin" | "patron" | "lecturer" | "registrar" | "staff";
}

const ProtectedRoute = ({ children, requiredRole }: Props) => {
  const { user, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (requiredRole && role !== requiredRole) {
    if (role === "admin" || (role === "staff" && requiredRole === "admin")) return <>{children}</>; // Admin & Staff bypass
    if (role === "lecturer") return <Navigate to="/lecturer/dashboard" replace />;
    if (role === "registrar") return <Navigate to="/registrar/dashboard" replace />;
    return <Navigate to="/home" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
