import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Loader2 } from "lucide-react";

const GuestRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  // If user is logged in, redirect to dashboard
  return user ? <Navigate to="/dashboard" replace /> : <Outlet />;
};

export default GuestRoute;
