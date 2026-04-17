import { useState } from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Button from "../components/UI/Button";
import Input from "../components/UI/Input";
import { ShieldCheck, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";

const VerifyReset = () => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const { verifyResetCode } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email;

  if (!email) return <Navigate to="/forgot-password" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (code.length !== 6) return toast.error("Enter 6-digit code");

    setLoading(true);
    try {
      const data = await verifyResetCode(email, code);
      navigate("/reset-password", { state: { resetToken: data.resetToken } });
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
            <ShieldCheck className="text-blue-600" size={32} />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Verify Identity</h1>
          <p className="text-gray-500 mt-2">Enter the 6-digit code from your authenticator app</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="2FA Code"
            placeholder="000000"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            required
          />

          <Button type="submit" loading={loading}>
            Verify Code
            <ArrowRight className="ml-2" size={20} />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default VerifyReset;
