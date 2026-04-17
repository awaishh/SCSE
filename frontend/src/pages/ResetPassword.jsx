import { useState } from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Button from "../components/UI/Button";
import Input from "../components/UI/Input";
import { Lock, Save } from "lucide-react";
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
      // Handled in context
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-800">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
            <Lock className="text-blue-600" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">New Password</h1>
          <p className="text-gray-500 mt-2">Enter your new secure password</p>
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
            <Save className="mr-2" size={20} />
            Reset Password
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
