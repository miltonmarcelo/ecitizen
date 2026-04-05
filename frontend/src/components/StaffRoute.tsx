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
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (!appUser || appUser.role !== "STAFF") {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default StaffRoute;