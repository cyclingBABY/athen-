import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import PatronHome from "./pages/PatronHome";
import PatronCatalog from "./pages/PatronCatalog";
import PatronMyBooks from "./pages/PatronMyBooks";
import PatronReservations from "./pages/PatronReservations";
import PatronFines from "./pages/PatronFines";
import PatronProfile from "./pages/PatronProfile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/home" element={<ProtectedRoute><PatronHome /></ProtectedRoute>} />
            <Route path="/catalog" element={<ProtectedRoute><PatronCatalog /></ProtectedRoute>} />
            <Route path="/my-books" element={<ProtectedRoute><PatronMyBooks /></ProtectedRoute>} />
            <Route path="/reservations" element={<ProtectedRoute><PatronReservations /></ProtectedRoute>} />
            <Route path="/fines" element={<ProtectedRoute><PatronFines /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><PatronProfile /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
