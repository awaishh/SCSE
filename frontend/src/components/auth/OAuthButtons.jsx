import React from "react";
import { Github, Chrome } from "lucide-react";

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
          <Chrome size={20} className="text-blue-500" />
          <span>Google</span>
        </button>
        
        <button
          onClick={() => handleOAuth("github")}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-all font-medium"
        >
          <Github size={20} className="text-gray-900 dark:text-white" />
          <span>GitHub</span>
        </button>
      </div>
    </div>
  );
};

export default OAuthButtons;
