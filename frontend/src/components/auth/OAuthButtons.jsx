import React from "react";

const OAuthButtons = () => {
  const handleOAuth = (provider) => {
    window.location.href = `http://localhost:5000/auth/${provider}`;
  };

  return (
    <div className="flex flex-col gap-3 w-full mt-4">
      <div className="relative flex items-center justify-center my-2">
        <span className="absolute px-2 bg-white dark:bg-gray-900 text-sm text-gray-500">Or continue with</span>
        <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
      </div>
      
      <div className="flex gap-4">
        <button
          onClick={() => handleOAuth("google")}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all font-medium"
        >
          <span>Google</span>
        </button>
        
        <button
          onClick={() => handleOAuth("github")}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all font-medium"
        >
          <span>GitHub</span>
        </button>
      </div>
    </div>
  );
};

export default OAuthButtons;
