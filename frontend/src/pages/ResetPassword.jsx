import { useState } from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Button from "../components/UI/Button";
import Input from "../components/UI/Input";
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
    } catch (error) {
      // handled in context
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#13121B] px-4">
      <div className="w-full max-w-md bg-[#181827] rounded-2xl shadow-2xl border border-[#302E46] p-8">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🔒</div>
          <h1 className="text-2xl font-bold text-white">Set New Password</h1>
          <p className="text-[#A9A8B8] mt-2 text-sm">Choose a strong password for your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="New Password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <Input
            label="Confirm Password"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <Button type="submit" loading={loading}>
            Reset Password
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
