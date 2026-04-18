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
    primary: "bg-[#B7FF2A] hover:bg-[#A6F11F] text-[#13121B] shadow-[0_0_15px_rgba(183,255,42,0.15)] font-[Orbitron] uppercase tracking-wider font-extrabold",
    secondary: "bg-[#181827] hover:bg-[#1C1A2A] text-white border border-[#302E46] font-[Orbitron] uppercase tracking-wider font-bold",
    outline: "border border-[#302E46] hover:border-[#B7FF2A] hover:text-[#B7FF2A] text-gray-300 font-[Orbitron] uppercase tracking-wider font-bold",
    danger: "bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-600/20 font-[Orbitron] uppercase tracking-wider font-bold",
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
          <span className={`w-4 h-4 border-2 rounded-full animate-spin ${variant === 'primary' ? 'border-[#13121B]/30 border-t-[#13121B]' : 'border-white/30 border-t-white'}`} />
          Loading...
        </span>
      ) : children}
    </button>
  );
};

export default Button;
