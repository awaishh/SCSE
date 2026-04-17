import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthLayout from "../components/auth/AuthLayout";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { forgotPassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await forgotPassword(email);
      navigate("/verify-reset", { state: { email } });
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
          RESET ACCESS
          <span className="w-1.5 h-1.5 bg-[#6D28D9] rounded-full ml-1" />
        </h2>
        <p className="text-[10px] uppercase tracking-[0.2em] text-[#64748b] mt-3 font-medium">
          We'll verify your identity via 2FA
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-[10px] uppercase tracking-[0.2em] text-[#64748b] mb-2 font-semibold">
            Email Address
          </label>
          <input
            type="email"
            placeholder="player@arena.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="input-underline"
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
            ) : "Continue"}
          </button>
        </div>
      </form>

      <div className="mt-10 text-center">
        <Link
          to="/login"
          className="text-[10px] uppercase tracking-[0.2em] text-[#64748b] hover:text-[#6D28D9] transition-colors"
        >
          ← Back to login
        </Link>
      </div>
    </AuthLayout>
  );
};

export default ForgotPassword;
