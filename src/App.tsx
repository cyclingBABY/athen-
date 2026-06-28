import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Navigate, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Landing from "./pages/Landing";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import StaffAuth from "./pages/StaffAuth";
import UserHome from "./pages/UserHome";
import UserCatalog from "./pages/UserCatalog";
import UserMyBooks from "./pages/UserMyBooks";
import UserReservations from "./pages/UserReservations";
import UserHolds from "./pages/UserHolds";

import UserFines from "./pages/UserFines";
import UserProfile from "./pages/UserProfile";
import Features from "./pages/Features";
import CatalogPreview from "./pages/CatalogPreview";
import About from "./pages/About";
import Contact from "./pages/Contact";

// Admin pages
import Cataloging from "./pages/admin/Cataloging";
import Barcoding from "./pages/admin/Barcoding";
import DigitalUpload from "./pages/admin/DigitalUpload";
import ShelfLocation from "./pages/admin/ShelfLocation";
import Circulation from "./pages/admin/Circulation";
import BookTracking from "./pages/admin/BookTracking";

import UserManagement from "./pages/admin/UserManagement";
import Inventory from "./pages/admin/Inventory";
import HoldManagement from "./pages/admin/HoldManagement";
import ReservationManagement from "./pages/admin/ReservationManagement";
import FineProcessing from "./pages/admin/FineProcessing";
import DigitalAccess from "./pages/admin/DigitalAccess";
import Weeding from "./pages/admin/Weeding";
import Reporting from "./pages/admin/Reporting";
import BulkImport from "./pages/admin/BulkImport";
import QRScanner from "./pages/admin/QRScanner";
import BarcodeStation from "./pages/admin/BarcodeStation";
import UserApproval from "./pages/admin/UserApproval";
import LecturerManagement from "./pages/admin/LecturerManagement";
import UserClearance from "./pages/UserClearance";
import RegistrarDashboard from "./pages/admin/RegistrarDashboard";
import UserAcademicServices from "./pages/UserAcademicServices";

// Lecturer pages
import LecturerDashboard from "./pages/lecturer/LecturerDashboard";
import LecturerMyBooks from "./pages/lecturer/LecturerMyBooks";
import LecturerReadingLists from "./pages/lecturer/LecturerReadingLists";
import LecturerUpload from "./pages/lecturer/LecturerUpload";
import LecturerRecommendations from "./pages/lecturer/LecturerRecommendations";
import LecturerRequests from "./pages/lecturer/LecturerRequests";
import LecturerDigitalLibrary from "./pages/lecturer/LecturerDigitalLibrary";
import LecturerNotifications from "./pages/lecturer/LecturerNotifications";
import LecturerProfile from "./pages/lecturer/LecturerProfile";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <HashRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/features" element={<Features />} />
            <Route path="/catalog-preview" element={<CatalogPreview />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/register" element={<Auth initialMode="register" />} />
            <Route path="/staff" element={<StaffAuth />} />
            <Route path="/dashboard" element={<ProtectedRoute><Index /></ProtectedRoute>} />

            {/* Admin routes */}
            <Route path="/admin/cataloging" element={<ProtectedRoute requiredRole="admin"><Cataloging /></ProtectedRoute>} />
            <Route path="/admin/barcoding" element={<ProtectedRoute requiredRole="admin"><Barcoding /></ProtectedRoute>} />
            <Route path="/admin/digital-upload" element={<ProtectedRoute requiredRole="admin"><DigitalUpload /></ProtectedRoute>} />
            <Route path="/admin/shelf-location" element={<ProtectedRoute requiredRole="admin"><ShelfLocation /></ProtectedRoute>} />
            <Route path="/admin/circulation" element={<ProtectedRoute requiredRole="admin"><Circulation /></ProtectedRoute>} />
            <Route path="/admin/book-tracking" element={<ProtectedRoute requiredRole="admin"><BookTracking /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute requiredRole="admin"><UserManagement /></ProtectedRoute>} />

            <Route path="/admin/approvals" element={<ProtectedRoute requiredRole="admin"><UserApproval /></ProtectedRoute>} />
            <Route path="/admin/lecturers" element={<ProtectedRoute requiredRole="admin"><LecturerManagement /></ProtectedRoute>} />
            <Route path="/admin/inventory" element={<ProtectedRoute requiredRole="admin"><Inventory /></ProtectedRoute>} />
            <Route path="/admin/holds" element={<ProtectedRoute requiredRole="admin"><HoldManagement /></ProtectedRoute>} />
            <Route path="/admin/reservations" element={<ProtectedRoute requiredRole="admin"><ReservationManagement /></ProtectedRoute>} />
            <Route path="/admin/fines" element={<ProtectedRoute requiredRole="admin"><FineProcessing /></ProtectedRoute>} />
            <Route path="/admin/digital-access" element={<ProtectedRoute requiredRole="admin"><DigitalAccess /></ProtectedRoute>} />
            <Route path="/admin/weeding" element={<ProtectedRoute requiredRole="admin"><Weeding /></ProtectedRoute>} />
            <Route path="/admin/reporting" element={<ProtectedRoute requiredRole="admin"><Reporting /></ProtectedRoute>} />
            <Route path="/admin/bulk-import" element={<ProtectedRoute requiredRole="admin"><BulkImport /></ProtectedRoute>} />
            <Route path="/admin/qr-scanner" element={<ProtectedRoute requiredRole="admin"><QRScanner /></ProtectedRoute>} />
            <Route path="/admin/barcode-station" element={<ProtectedRoute requiredRole="admin"><BarcodeStation /></ProtectedRoute>} />
            <Route path="/registrar/dashboard" element={<ProtectedRoute requiredRole="registrar"><RegistrarDashboard /></ProtectedRoute>} />

            {/* Lecturer routes */}
            <Route path="/lecturer/dashboard" element={<ProtectedRoute requiredRole="lecturer"><LecturerDashboard /></ProtectedRoute>} />
            <Route path="/lecturer/my-books" element={<ProtectedRoute requiredRole="lecturer"><LecturerMyBooks /></ProtectedRoute>} />
            <Route path="/lecturer/reading-lists" element={<ProtectedRoute requiredRole="lecturer"><LecturerReadingLists /></ProtectedRoute>} />
            <Route path="/lecturer/upload" element={<ProtectedRoute requiredRole="lecturer"><LecturerUpload /></ProtectedRoute>} />
            <Route path="/lecturer/recommendations" element={<ProtectedRoute requiredRole="lecturer"><LecturerRecommendations /></ProtectedRoute>} />
            <Route path="/lecturer/requests" element={<ProtectedRoute requiredRole="lecturer"><LecturerRequests /></ProtectedRoute>} />
            <Route path="/lecturer/digital-library" element={<ProtectedRoute requiredRole="lecturer"><LecturerDigitalLibrary /></ProtectedRoute>} />
            <Route path="/lecturer/notifications" element={<ProtectedRoute requiredRole="lecturer"><LecturerNotifications /></ProtectedRoute>} />
            <Route path="/lecturer/profile" element={<ProtectedRoute requiredRole="lecturer"><LecturerProfile /></ProtectedRoute>} />

            {/* User routes */}
            <Route path="/home" element={<ProtectedRoute><UserHome /></ProtectedRoute>} />
            <Route path="/catalog" element={<ProtectedRoute><UserCatalog /></ProtectedRoute>} />
            <Route path="/my-books" element={<ProtectedRoute><UserMyBooks /></ProtectedRoute>} />
            <Route path="/holds" element={<ProtectedRoute><UserHolds /></ProtectedRoute>} />
            <Route path="/reservations" element={<ProtectedRoute><UserReservations /></ProtectedRoute>} />
            <Route path="/clearance" element={<ProtectedRoute><UserClearance /></ProtectedRoute>} />
            <Route path="/academic-services" element={<ProtectedRoute><UserAcademicServices /></ProtectedRoute>} />

            <Route path="/fines" element={<ProtectedRoute><UserFines /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </HashRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
