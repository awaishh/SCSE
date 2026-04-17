import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthLayout from "../components/auth/AuthLayout";
import OAuthButtons from "../components/auth/OAuthButtons";
import toast from "react-hot-toast";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const Login = () => {
  const { login, verify2FALogin } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFACode, setTwoFACode] = useState("");
  const [pendingCredentials, setPendingCredentials] = useState(null);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const result = await login(data);
      if (result?.requires2FA) {
        setPendingCredentials(data);
        setRequires2FA(true);
      } else {
        navigate("/dashboard");
      }
    } catch {
      // handled by toast in context
    } finally {
      setIsSubmitting(false);
    }
  };

  const handle2FASubmit = async (e) => {
    e.preventDefault();
    if (twoFACode.length !== 6) return toast.error("Enter a 6-digit code");
    setIsSubmitting(true);
    try {
      await verify2FALogin({ ...pendingCredentials, code: twoFACode });
      navigate("/dashboard");
    } catch {
      // handled by toast in context
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      {!requires2FA ? (
        <>
          {/* Header */}
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-[#0f172a] tracking-tight">
              Welcome back
            </h2>
            <p className="text-[#64748b] text-sm mt-2">
              Sign in to your Battle Arena account
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">

            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1.5 uppercase tracking-wide">
                Email Address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                className={`w-full px-4 py-3 rounded-lg border-2 text-sm text-[#0f172a] placeholder-[#9ca3af] bg-white outline-none transition-all duration-200
                  ${errors.email
                    ? "border-red-400 focus:border-red-500"
                    : "border-[#e2e8f0] focus:border-[#6D28D9]"
                  }`}
                {...register("email")}
              />
              {errors.email && (
                <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                  <span>⚠</span> {errors.email.message}
                </p>
              )}
            </div>

            {/* Password */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-semibold text-[#374151] uppercase tracking-wide">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs text-[#6D28D9] hover:text-[#5b21b6] font-medium transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                placeholder="••••••••"
                className={`w-full px-4 py-3 rounded-lg border-2 text-sm text-[#0f172a] placeholder-[#9ca3af] bg-white outline-none transition-all duration-200
                  ${errors.password
                    ? "border-red-400 focus:border-red-500"
                    : "border-[#e2e8f0] focus:border-[#6D28D9]"
                  }`}
                {...register("password")}
              />
              {errors.password && (
                <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                  <span>⚠</span> {errors.password.message}
                </p>
              )}
            </div>

            {/* Submit */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#6D28D9] hover:bg-[#5b21b6] active:bg-[#4c1d95] disabled:opacity-60 disabled:cursor-not-allowed text-white py-3.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-[#6D28D9]/25"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Signing in...
                  </>
                ) : (
                  "Sign In"
                )}
              </button>
            </div>
          </form>

          <OAuthButtons />

          <p className="text-center mt-6 text-sm text-[#64748b]">
            Don't have an account?{" "}
            <Link
              to="/register"
              className="text-[#6D28D9] hover:text-[#5b21b6] font-semibold transition-colors"
            >
              Create one
            </Link>
          </p>

          {/* Footer links */}
          <div className="mt-12 flex justify-center gap-5">
            {["Privacy", "Terms", "About"].map((item) => (
              <a
                key={item}
                href="#"
                className="text-[11px] text-[#94a3b8] hover:text-[#64748b] transition-colors"
              >
                {item}
              </a>
            ))}
          </div>
        </>
      ) : (
        /* ── 2FA Step ── */
        <>
          <div className="mb-10">
            <div className="w-12 h-12 bg-[#6D28D9]/10 rounded-xl flex items-center justify-center mb-5">
              <span className="material-symbols-outlined text-[#6D28D9] text-2xl">lock</span>
            </div>
            <h2 className="text-3xl font-bold text-[#0f172a] tracking-tight">
              Two-factor auth
            </h2>
            <p className="text-[#64748b] text-sm mt-2">
              Enter the 6-digit code from your authenticator app
            </p>
          </div>

          <form onSubmit={handle2FASubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-[#374151] mb-1.5 uppercase tracking-wide">
                Authentication Code
              </label>
              <input
                type="text"
                placeholder="000 000"
                maxLength={6}
                value={twoFACode}
                onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, ""))}
                className="w-full px-4 py-3 rounded-lg border-2 border-[#e2e8f0] focus:border-[#6D28D9] text-center text-2xl font-bold tracking-[0.4em] text-[#0f172a] bg-white outline-none transition-all duration-200"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#6D28D9] hover:bg-[#5b21b6] disabled:opacity-60 disabled:cursor-not-allowed text-white py-3.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-[#6D28D9]/25"
              >
                {isSubmitting ? (
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  "Verify & Sign In"
                )}
              </button>
            </div>
          </form>

          <button
            onClick={() => { setRequires2FA(false); setTwoFACode(""); }}
            className="w-full text-center mt-5 text-sm text-[#64748b] hover:text-[#0f172a] transition-colors"
          >
            ← Back to login
          </button>
        </>
      )}
    </AuthLayout>
  );
};

export default Login;
