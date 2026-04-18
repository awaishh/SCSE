import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Input from "../components/UI/Input";
import Button from "../components/UI/Button";
import OAuthButtons from "../components/auth/OAuthButtons";

const registerSchema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

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
      const { confirmPassword, ...registerData } = data;
      await registerUser(registerData);
      navigate("/login");
    } catch (error) {
      // handled by toast in context
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#13121B] px-4 py-12 font-['Satoshi']">
      <div className="w-full max-w-md bg-[#181827] rounded-2xl shadow-[0_20px_40px_rgba(0,0,0,0.5)] p-8 border border-[#302E46]">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-[Orbitron] font-black uppercase text-white tracking-wide">Create Account</h1>
          <p className="text-[#A9A8B8] mt-2 text-sm font-medium">JOIN THE BATTLE ARENA</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <Input
            label="Full Name"
            type="text"
            placeholder="John Doe"
            error={errors.name}
            {...register("name")}
          />
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
          <Input
            label="Confirm Password"
            type="password"
            placeholder="••••••••"
            error={errors.confirmPassword}
            {...register("confirmPassword")}
          />

          <Button type="submit" loading={isSubmitting}>
            Create Account
          </Button>
        </form>

        <OAuthButtons />

        <p className="text-center mt-6 text-sm text-[#A9A8B8]">
          ALREADY IN THE ARENA?{" "}
          <Link to="/login" className="text-[#B7FF2A] hover:text-[#A6F11F] font-black uppercase tracking-wide transition-colors">
            SIGN IN
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
