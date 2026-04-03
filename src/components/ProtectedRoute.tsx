import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { getDeniedMessage, getHomeRouteForRole, type AppRole } from "@/lib/authz";

interface Props {
  children: React.ReactNode;
  requiredRole?: AppRole;
}

export default function ProtectedRoute({ children, requiredRole }: Props) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (requiredRole && profile.role !== requiredRole) {
    return (
      <Navigate
        to={getHomeRouteForRole(profile.role)}
        replace
        state={{
          denied: {
            attemptedPath: location.pathname,
            message: getDeniedMessage(requiredRole, profile.role),
          },
        }}
      />
    );
  }

  return <>{children}</>;
}
