import React from "react";
import { Loader2 } from "lucide-react";

const Button = ({ children, loading, variant = "primary", className = "", ...props }) => {
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white",
    secondary: "bg-gray-200 hover:bg-gray-300 text-gray-800",
    outline: "border-2 border-blue-600 text-blue-600 hover:bg-blue-50",
    danger: "bg-red-600 hover:bg-red-700 text-white",
  };

  return (
    <button
      disabled={loading || props.disabled}
      className={`w-full flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-all disabled:opacity-70 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
      {...props}
    >
      {loading ? <Loader2 className="animate-spin mr-2" size={20} /> : null}
      {children}
    </button>
  );
};

export default Button;
