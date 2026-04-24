import { Navigate, useLocation } from "react-router-dom";
import { ReactNode } from "react";
import { useAuth } from "@/context/AuthContext";

interface StaffRouteProps {
  children: ReactNode;
}

const StaffRoute = ({ children }: StaffRouteProps) => {
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

  // Allows both STAFF and ADMIN into staff pages.
  if (!appUser || (appUser.role !== "STAFF" && appUser.role !== "ADMIN")) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default StaffRoute;
