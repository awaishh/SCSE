import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Input from "../components/UI/Input";
import Button from "../components/UI/Button";
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
  // 2FA step state
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
      // If backend signals 2FA required
      if (result?.requires2FA) {
        setPendingCredentials(data);
        setRequires2FA(true);
      } else {
        navigate("/dashboard");
      }
    } catch (error) {
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
    } catch (error) {
      // handled by toast in context
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-md bg-gray-900 rounded-2xl shadow-2xl p-8 border border-gray-800">

        {!requires2FA ? (
          <>
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-white">Welcome Back</h1>
              <p className="text-gray-400 mt-2 text-sm">Sign in to your account</p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              <Input
                label="Email Address"
                type="email"
                placeholder="john@example.com"
                error={errors.email}
                {...register("email")}
              />
              <Input
                label="Password"
                type="password"
                placeholder="••••••••"
                error={errors.password}
                {...register("password")}
              />

              <div className="flex justify-end mb-4">
                <Link to="/forgot-password" className="text-sm text-blue-400 hover:text-blue-300">
                  Forgot password?
                </Link>
              </div>

              <Button type="submit" loading={isSubmitting}>
                Sign In
              </Button>
            </form>

            <OAuthButtons />

            <p className="text-center mt-6 text-sm text-gray-500">
              Don't have an account?{" "}
              <Link to="/register" className="text-blue-400 hover:text-blue-300 font-semibold">
                Create one
              </Link>
            </p>
          </>
        ) : (
          <>
            <div className="text-center mb-8">
              <div className="w-14 h-14 bg-blue-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🔐</span>
              </div>
              <h1 className="text-2xl font-bold text-white">Two-Factor Auth</h1>
              <p className="text-gray-400 mt-2 text-sm">Enter the 6-digit code from your authenticator app</p>
            </div>

            <form onSubmit={handle2FASubmit}>
              <Input
                label="Authentication Code"
                placeholder="000000"
                maxLength={6}
                value={twoFACode}
                onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, ""))}
              />
              <Button type="submit" loading={isSubmitting}>
                Verify & Sign In
              </Button>
            </form>

            <button
              onClick={() => { setRequires2FA(false); setTwoFACode(""); }}
              className="w-full text-center mt-4 text-sm text-gray-500 hover:text-gray-300"
            >
              ← Back to login
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default Login;
