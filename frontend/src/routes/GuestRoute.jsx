import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const GuestRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="text-blue-600 animate-pulse font-medium text-xl">Loading...</div>
      </div>
    );
  }

  // If user is logged in, redirect to dashboard
  return user ? <Navigate to="/dashboard" replace /> : <Outlet />;
};

export default GuestRoute;
