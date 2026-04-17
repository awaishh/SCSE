import React from "react";

const Button = ({
  children,
  type = "button",
  variant = "primary",
  loading = false,
  className = "",
  disabled = false,
  ...props
}) => {
  const baseStyles = "w-full py-3 px-4 rounded-xl font-bold transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98]";
  
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30",
    secondary: "bg-gray-100 hover:bg-gray-200 text-gray-900 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700",
    outline: "border-2 border-gray-200 hover:border-blue-600 hover:text-blue-600 dark:border-gray-700 dark:text-gray-300",
    danger: "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20",
  };

  return (
    <button
      type={type}
      disabled={loading || disabled}
      className={`${baseStyles} ${variants[variant]} ${className} ${
        (loading || disabled) ? "opacity-70 cursor-not-allowed grayscale-[0.5]" : ""
      }`}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
