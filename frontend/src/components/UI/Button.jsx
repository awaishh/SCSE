const Button = ({
  children,
  type = "button",
  variant = "primary",
  loading = false,
  className = "",
  disabled = false,
  ...props
}) => {
  const base = "w-full py-2.5 px-4 rounded-xl font-semibold transition-all duration-200 flex items-center justify-center gap-2 active:scale-[0.98] text-sm";

  const variants = {
    primary: "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20",
    secondary: "bg-gray-800 hover:bg-gray-700 text-white border border-gray-700",
    outline: "border border-gray-700 hover:border-blue-500 hover:text-blue-400 text-gray-300",
    danger: "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/20",
  };

  return (
    <button
      type={type}
      disabled={loading || disabled}
      className={`${base} ${variants[variant]} ${className} ${
        loading || disabled ? "opacity-60 cursor-not-allowed" : ""
      }`}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          Loading...
        </span>
      ) : children}
    </button>
  );
};

export default Button;
