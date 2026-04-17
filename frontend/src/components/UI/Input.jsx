import React from "react";

const Input = React.forwardRef(({ label, error, type = "text", ...props }, ref) => {
  return (
    <div className="w-full mb-4">
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-1">
          {label}
        </label>
      )}
      <input
        ref={ref}
        type={type}
        className={`w-full px-4 py-2.5 rounded-lg border bg-gray-800 text-white placeholder-gray-500
          focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all
          ${error ? "border-red-500" : "border-gray-700 hover:border-gray-600"}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-400">{error.message}</p>}
    </div>
  );
});

Input.displayName = "Input";

export default Input;
