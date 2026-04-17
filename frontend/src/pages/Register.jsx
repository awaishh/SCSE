import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AuthLayout from "../components/auth/AuthLayout";
import OAuthButtons from "../components/auth/OAuthButtons";

const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

// Reusable field — same style as Login inputs
const Field = ({ label, type = "text", placeholder, reg, error }) => (
  <div>
    <label className="block text-xs font-semibold text-[#374151] mb-1.5 uppercase tracking-wide">
      {label}
    </label>
    <input
      type={type}
      placeholder={placeholder}
      className={`w-full px-4 py-3 rounded-lg border-2 text-sm text-[#0f172a] placeholder-[#9ca3af] bg-white outline-none transition-all duration-200
        ${error
          ? "border-red-400 focus:border-red-500"
          : "border-[#e2e8f0] focus:border-[#6D28D9]"
        }`}
      {...reg}
    />
    {error && (
      <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
        <span>⚠</span> {error.message}
      </p>
    )}
  </div>
);

const Register = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      const { confirmPassword, ...payload } = data;
      await registerUser(payload);
      navigate("/login");
    } catch {
      // handled by toast in context
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthLayout>
      {/* Header — same style as Login */}
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-[#0f172a] tracking-tight">
          Create account
        </h2>
        <p className="text-[#64748b] text-sm mt-2">
          Join Battle Arena and start competing
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <Field
          label="Full Name"
          placeholder="John Doe"
          reg={register("name")}
          error={errors.name}
        />
        <Field
          label="Email Address"
          type="email"
          placeholder="you@example.com"
          reg={register("email")}
          error={errors.email}
        />
        <Field
          label="Password"
          type="password"
          placeholder="••••••••"
          reg={register("password")}
          error={errors.password}
        />
        <Field
          label="Confirm Password"
          type="password"
          placeholder="••••••••"
          reg={register("confirmPassword")}
          error={errors.confirmPassword}
        />

        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#6D28D9] hover:bg-[#5b21b6] active:bg-[#4c1d95] disabled:opacity-60 disabled:cursor-not-allowed text-white py-3.5 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center justify-center gap-2 shadow-lg shadow-[#6D28D9]/25"
          >
            {isSubmitting ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creating...
              </>
            ) : "Create Account"}
          </button>
        </div>
      </form>

      <OAuthButtons />

      <p className="text-center mt-6 text-sm text-[#64748b]">
        Already have an account?{" "}
        <Link
          to="/login"
          className="text-[#6D28D9] hover:text-[#5b21b6] font-semibold transition-colors"
        >
          Sign in
        </Link>
      </p>
    </AuthLayout>
  );
};

export default Register;
