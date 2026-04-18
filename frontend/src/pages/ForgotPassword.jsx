import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Button from "../components/UI/Button";
import Input from "../components/UI/Input";

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
          <div className="text-4xl mb-3">🔑</div>
          <h1 className="text-2xl font-bold text-white">Forgot Password?</h1>
          <p className="text-[#A9A8B8] mt-2 text-sm">
            Enter your email — we'll verify your identity via 2FA
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="john@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <Button type="submit" loading={loading}>
            Continue
          </Button>
        </form>

        <div className="text-center mt-6">
          <Link to="/login" className="text-sm text-[#B7FF2A] hover:text-[#A6F11F]">
            ← Back to login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
