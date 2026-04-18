import React from "react";

const Input = React.forwardRef(({ label, error, type = "text", ...props }, ref) => {
  return (
    <div className="w-full mb-4">
      {label && (
        <label className="block text-xs font-[Orbitron] uppercase tracking-widest text-[#A9A8B8] mb-1.5 ml-1">
          {label}
        </label>
      )}
      <input
        ref={ref}
        type={type}
        className={`w-full px-4 py-3 rounded-xl border-2 bg-[#1C1A2A] text-white placeholder-[#6D6A7E]
          focus:ring-1 focus:ring-[#B7FF2A] focus:border-[#B7FF2A] focus:shadow-[0_0_15px_rgba(183,255,42,0.1)] outline-none transition-all
          ${error ? "border-red-500" : "border-[#302E46] hover:border-[#4A4763]"}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-400">{error.message}</p>}
    </div>
  );
});

Input.displayName = "Input";

export default Input;
