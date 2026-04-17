import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Input from "../components/UI/Input";
import Button from "../components/UI/Button";
import OAuthButtons from "../components/auth/OAuthButtons";
import { useState } from "react";

const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const Login = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      await login(data);
      navigate("/dashboard");
    } catch (error) {
      // Error handled by toast in context
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-800">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome Back</h1>
          <p className="text-gray-500 mt-2">Please enter your details to login</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
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

          <Button type="submit" loading={isSubmitting} className="mt-2">
            Sign In
          </Button>
        </form>

        <OAuthButtons />

        <p className="text-center mt-8 text-sm text-gray-600 dark:text-gray-400">
          Don't have an account?{" "}
          <Link to="/register" className="text-blue-600 hover:underline font-semibold">
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
