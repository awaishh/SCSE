import { useState } from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Button from "../components/UI/Button";
import Input from "../components/UI/Input";
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
    if (code.length !== 6) return toast.error("Enter a 6-digit code");
    setLoading(true);
    try {
      const data = await verifyResetCode(email, code);
      navigate("/reset-password", { state: { resetToken: data.resetToken } });
    } catch (error) {
      // handled in context
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-md bg-gray-900 rounded-2xl shadow-2xl border border-gray-800 p-8">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">📱</div>
          <h1 className="text-2xl font-bold text-white">Verify Identity</h1>
          <p className="text-gray-400 mt-2 text-sm">
            Enter the 6-digit code from your authenticator app for{" "}
            <span className="text-white font-medium">{email}</span>
          </p>
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
          </Button>
        </form>
      </div>
    </div>
  );
};

export default VerifyReset;
