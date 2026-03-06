import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import PatronHome from "./pages/PatronHome";
import PatronCatalog from "./pages/PatronCatalog";
import PatronMyBooks from "./pages/PatronMyBooks";
import PatronReservations from "./pages/PatronReservations";
import PatronFines from "./pages/PatronFines";
import PatronProfile from "./pages/PatronProfile";
import NotFound from "./pages/NotFound";

// Admin pages
import Cataloging from "./pages/admin/Cataloging";
import Barcoding from "./pages/admin/Barcoding";
import DigitalUpload from "./pages/admin/DigitalUpload";
import ShelfLocation from "./pages/admin/ShelfLocation";
import Circulation from "./pages/admin/Circulation";
import PatronManagement from "./pages/admin/PatronManagement";
import Inventory from "./pages/admin/Inventory";
import HoldManagement from "./pages/admin/HoldManagement";
import FineProcessing from "./pages/admin/FineProcessing";
import DigitalAccess from "./pages/admin/DigitalAccess";
import Weeding from "./pages/admin/Weeding";
import Reporting from "./pages/admin/Reporting";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/dashboard" element={<ProtectedRoute><Index /></ProtectedRoute>} />

            {/* Admin routes */}
            <Route path="/admin/cataloging" element={<ProtectedRoute requiredRole="admin"><Cataloging /></ProtectedRoute>} />
            <Route path="/admin/barcoding" element={<ProtectedRoute requiredRole="admin"><Barcoding /></ProtectedRoute>} />
            <Route path="/admin/digital-upload" element={<ProtectedRoute requiredRole="admin"><DigitalUpload /></ProtectedRoute>} />
            <Route path="/admin/shelf-location" element={<ProtectedRoute requiredRole="admin"><ShelfLocation /></ProtectedRoute>} />
            <Route path="/admin/circulation" element={<ProtectedRoute requiredRole="admin"><Circulation /></ProtectedRoute>} />
            <Route path="/admin/patrons" element={<ProtectedRoute requiredRole="admin"><PatronManagement /></ProtectedRoute>} />
            <Route path="/admin/inventory" element={<ProtectedRoute requiredRole="admin"><Inventory /></ProtectedRoute>} />
            <Route path="/admin/holds" element={<ProtectedRoute requiredRole="admin"><HoldManagement /></ProtectedRoute>} />
            <Route path="/admin/fines" element={<ProtectedRoute requiredRole="admin"><FineProcessing /></ProtectedRoute>} />
            <Route path="/admin/digital-access" element={<ProtectedRoute requiredRole="admin"><DigitalAccess /></ProtectedRoute>} />
            <Route path="/admin/weeding" element={<ProtectedRoute requiredRole="admin"><Weeding /></ProtectedRoute>} />
            <Route path="/admin/reporting" element={<ProtectedRoute requiredRole="admin"><Reporting /></ProtectedRoute>} />

            {/* Patron routes */}
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
