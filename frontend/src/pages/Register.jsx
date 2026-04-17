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
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-950 px-4 py-12">
      <div className="w-full max-w-md bg-gray-900 rounded-2xl shadow-2xl p-8 border border-gray-800">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white">Create Account</h1>
          <p className="text-gray-400 mt-2 text-sm">Join the battle arena</p>
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

        <p className="text-center mt-6 text-sm text-gray-500">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-400 hover:text-blue-300 font-semibold">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
