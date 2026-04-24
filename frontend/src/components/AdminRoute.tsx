import { Navigate, useLocation } from "react-router-dom";
import { ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";

interface AdminRouteProps {
  children: ReactNode;
}

const AdminRoute = ({ children }: AdminRouteProps) => {
  const location = useLocation();
  const { user, appUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) {
    // Keeps the original target route so login can return here after auth.
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // Blocks non-admin users even when they are already authenticated.
  if (!appUser || appUser.role !== "ADMIN") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md w-full rounded-lg border bg-card p-6 text-center">
          <h1 className="text-lg font-semibold text-foreground mb-2">Access Denied</h1>
          <p className="text-sm text-muted-foreground mb-4">
            Only Admins have permission to access this area.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

export default AdminRoute;
