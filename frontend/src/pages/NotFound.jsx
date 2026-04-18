import { Link } from "react-router-dom";

const NotFound = () => (
  <div className="min-h-screen w-full flex items-center justify-center bg-[#13121B] px-4">
    <div className="text-center">
      <p className="text-8xl font-black text-gray-800">404</p>
      <h1 className="text-2xl font-bold text-white mt-4">Page Not Found</h1>
      <p className="text-[#A9A8B8] mt-2 text-sm">The page you're looking for doesn't exist.</p>
      <Link
        to="/login"
        className="inline-block mt-6 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
      >
        Go to Login
      </Link>
    </div>
  </div>
);

export default NotFound;
