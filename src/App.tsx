import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import AppLayout from "@/components/AppLayout";
import Auth from "@/pages/Auth";
import ConductorDashboard from "@/pages/conductor/ConductorDashboard";
import ConductorVehicles from "@/pages/conductor/ConductorVehicles";
import ConductorDocuments from "@/pages/conductor/ConductorDocuments";
import ConductorRequests from "@/pages/conductor/ConductorRequests";
import ConductorMileage from "@/pages/conductor/ConductorMileage";
import ConductorMessages from "@/pages/conductor/ConductorMessages";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import AdminSearch from "@/pages/admin/AdminSearch";
import AdminVehicles from "@/pages/admin/AdminVehicles";
import AdminRequests from "@/pages/admin/AdminRequests";
import AdminMessages from "@/pages/admin/AdminMessages";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

/** Redirige al dashboard según el rol del usuario autenticado */
function RootRedirect() {
  const { user, profile, loading } = useAuth();
  if (loading) return <div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (!profile) return <div className="flex min-h-screen items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>;
  return <Navigate to={profile.role === "admin" ? "/admin" : "/conductor"} replace />;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<RootRedirect />} />
            <Route path="/auth" element={<Auth />} />

            {/* Rutas Conductor */}
            <Route path="/conductor" element={<ProtectedRoute requiredRole="conductor"><AppLayout><ConductorDashboard /></AppLayout></ProtectedRoute>} />
            <Route path="/conductor/vehicles" element={<ProtectedRoute requiredRole="conductor"><AppLayout><ConductorVehicles /></AppLayout></ProtectedRoute>} />
            <Route path="/conductor/documents" element={<ProtectedRoute requiredRole="conductor"><AppLayout><ConductorDocuments /></AppLayout></ProtectedRoute>} />
            <Route path="/conductor/requests" element={<ProtectedRoute requiredRole="conductor"><AppLayout><ConductorRequests /></AppLayout></ProtectedRoute>} />
            <Route path="/conductor/mileage" element={<ProtectedRoute requiredRole="conductor"><AppLayout><ConductorMileage /></AppLayout></ProtectedRoute>} />
            <Route path="/conductor/messages" element={<ProtectedRoute requiredRole="conductor"><AppLayout><ConductorMessages /></AppLayout></ProtectedRoute>} />

            {/* Rutas Admin */}
            <Route path="/admin" element={<ProtectedRoute requiredRole="admin"><AppLayout><AdminDashboard /></AppLayout></ProtectedRoute>} />
            <Route path="/admin/search" element={<ProtectedRoute requiredRole="admin"><AppLayout><AdminSearch /></AppLayout></ProtectedRoute>} />
            <Route path="/admin/vehicles" element={<ProtectedRoute requiredRole="admin"><AppLayout><AdminVehicles /></AppLayout></ProtectedRoute>} />
            <Route path="/admin/requests" element={<ProtectedRoute requiredRole="admin"><AppLayout><AdminRequests /></AppLayout></ProtectedRoute>} />
            <Route path="/admin/messages" element={<ProtectedRoute requiredRole="admin"><AppLayout><AdminMessages /></AppLayout></ProtectedRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
