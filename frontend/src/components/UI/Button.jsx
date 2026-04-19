const Button = ({
  children,
  type = "button",
  variant = "primary",
  loading = false,
  className = "",
  disabled = false,
  ...props
}) => {
  const base = "relative group px-8 py-4 font-[Oxanium] transition-all duration-300 flex items-center justify-center gap-3 active:scale-[0.97] text-sm uppercase tracking-[0.2em] font-black overflow-hidden select-none outline-none";

  const variants = {
    primary: {
      bg: "bg-[#B7FF2A]",
      text: "text-[#13121B]",
      border: "border-[#B7FF2A]",
      clip: "clip-valorant-edge",
      glow: "shadow-[0_0_20px_rgba(183,255,42,0.2)]",
      hoverGlow: "group-hover:shadow-[0_0_40px_rgba(183,255,42,0.4)]"
    },
    secondary: {
      bg: "bg-[#181827]",
      text: "text-white",
      border: "border-[#302E46]",
      clip: "clip-valorant-edge",
      glow: "",
      hoverGlow: ""
    },
    outline: {
      bg: "bg-transparent",
      text: "text-gray-300",
      border: "border-[#302E46]",
      clip: "clip-valorant-edge",
      glow: "",
      hoverGlow: "group-hover:border-[#B7FF2A]"
    },
    danger: {
      bg: "bg-[#ff4655]",
      text: "text-white",
      border: "border-[#ff4655]",
      clip: "clip-valorant-edge",
      glow: "shadow-[0_0_20px_rgba(255,70,85,0.2)]",
      hoverGlow: "group-hover:shadow-[0_0_40px_rgba(255,70,85,0.4)]"
    }
  };

  const current = variants[variant] || variants.primary;

  return (
    <button
      type={type}
      disabled={loading || disabled}
      className={`${base} ${current.text} ${className} ${
        loading || disabled ? "opacity-50 cursor-not-allowed" : ""
      }`}
      {...props}
    >
      {/* 1. Base Background Layer (Slightly Muted) */}
      <div className={`absolute inset-0 ${current.bg} ${current.clip} ${current.glow} ${current.hoverGlow} transition-all duration-300`} />

      {/* 2. Tactical Patterns (Mesh & Dots - Higher Visibility) */}
      <div className={`absolute inset-0 bg-tactical-mesh opacity-40 ${current.clip}`} />
      <div className={`absolute inset-0 bg-micro-dots opacity-25 ${current.clip}`} />
      
      {/* 3. Outer Vignette Depth (Reduces Flat Neon Look) */}
      <div className={`absolute inset-0 shadow-[inner_0_0_20px_rgba(0,0,0,0.15)] ${current.clip} pointer-events-none`} />

      {/* 4. Interactive Sliding Overlay (Reduced intensity) */}
      <div className="absolute inset-0 translate-x-[-105%] group-hover:translate-x-0 transition-transform duration-700 ease-[cubic-bezier(0.23,1,0.32,1)] bg-white/10 skew-x-[-15deg] pointer-events-none" />
      
      {/* 5. Broken Border Accents (Reduced shift) */}
      <div className={`absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 ${current.border} opacity-50 group-hover:opacity-100 group-hover:translate-x-[-1px] group-hover:translate-y-[-1px] transition-all`} />
      <div className={`absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 ${current.border} opacity-50 group-hover:opacity-100 group-hover:translate-x-[1px] group-hover:translate-y-[1px] transition-all`} />

      {/* 6. Content Layer */}
      <span className="relative z-10 flex items-center justify-center gap-2">
        {loading ? (
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 border-2 rounded-full animate-spin ${variant === 'primary' ? 'border-[#13121B]/30 border-t-[#13121B]' : 'border-white/30 border-t-white'}`} />
            <span className="animate-glitch">SYSTEM ACTIVE...</span>
          </div>
        ) : children}
      </span>
    </button>
  );
};

export default Button;
