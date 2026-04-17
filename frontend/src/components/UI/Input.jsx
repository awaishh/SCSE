import React from "react";

const Input = React.forwardRef(({ label, error, type = "text", ...props }, ref) => {
  return (
    <div className="w-full mb-4">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}
      <input
        ref={ref}
        type={type}
        className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-blue-500 outline-none transition-all
          ${error ? "border-red-500 bg-red-50" : "border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white"}
        `}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error.message}</p>}
    </div>
  );
});

Input.displayName = "Input";

export default Input;
