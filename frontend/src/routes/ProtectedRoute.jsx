import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-white">
        <div className="text-center">
          <span className="w-6 h-6 border-2 border-[#6D28D9] border-t-transparent rounded-full animate-spin inline-block" />
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#64748b] mt-4">Loading...</p>
        </div>
      </div>
    );
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
