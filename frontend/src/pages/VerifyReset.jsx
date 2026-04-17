import { useState } from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthLayout from "../components/auth/AuthLayout";
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
          VERIFY IDENTITY
          <span className="w-1.5 h-1.5 bg-[#6D28D9] rounded-full ml-1" />
        </h2>
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#64748b] mt-3 font-medium">
          Enter the 6-digit code from your authenticator app
        </p>
        <p className="text-xs text-[#64748b] mt-2">
          for <span className="font-semibold text-[#1e1b4b]">{email}</span>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-[10px] uppercase tracking-[0.2em] text-[#64748b] mb-2 font-semibold">
            2FA Code
          </label>
          <input
            type="text"
            placeholder="000000"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            className="input-underline text-center text-2xl tracking-[0.5em]"
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
            ) : "Verify Code"}
          </button>
        </div>
      </form>
    </AuthLayout>
  );
};

export default VerifyReset;
