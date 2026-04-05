import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

type PublicOnlyRouteProps = {
  children: React.ReactNode;
};

const PublicOnlyRoute = ({ children }: PublicOnlyRouteProps) => {
  const { user, appUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (user && appUser?.role === "STAFF") {
    return <Navigate to="/staff/dashboard" replace />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default PublicOnlyRoute;