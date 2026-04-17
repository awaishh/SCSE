import { useState } from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthLayout from "../components/auth/AuthLayout";
import toast from "react-hot-toast";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { resetPassword } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const resetToken = location.state?.resetToken;

  if (!resetToken) return <Navigate to="/login" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) return toast.error("Password must be at least 8 characters");
    if (password !== confirmPassword) return toast.error("Passwords don't match");
    setLoading(true);
    try {
      await resetPassword(resetToken, password);
      navigate("/login");
    } catch {
      // handled in context
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="text-center mb-12">
        <h2 className="text-2xl font-bold tracking-[0.3em] uppercase text-[#1e1b4b] inline-flex items-center">
          NEW PASSWORD
          <span className="w-1.5 h-1.5 bg-[#6D28D9] rounded-full ml-1" />
        </h2>
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#64748b] mt-3 font-medium">
          Choose a strong password for your account
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-[10px] uppercase tracking-[0.2em] text-[#64748b] mb-2 font-semibold">
            New Password
          </label>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="input-underline"
            required
          />
        </div>

        <div>
          <label className="block text-[10px] uppercase tracking-[0.2em] text-[#64748b] mb-2 font-semibold">
            Confirm Password
          </label>
          <input
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="input-underline"
            required
          />
        </div>

        <div className="pt-6">
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#6D28D9] hover:bg-[#6D28D9]/90 disabled:opacity-60 text-white py-4 text-[11px] uppercase tracking-[0.2em] font-bold transition-all duration-300 rounded-sm flex items-center justify-center gap-2"
          >
            {loading ? (
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : "Reset Password"}
          </button>
        </div>
      </form>
    </AuthLayout>
  );
};

export default ResetPassword;
