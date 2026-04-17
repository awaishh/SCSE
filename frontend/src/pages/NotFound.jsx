import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white text-[#1e1b4b]">
      <div className="text-center">
        <h1 className="text-6xl font-black tracking-tight">404</h1>
        <p className="text-gray-400 mt-2">Page not found</p>
        <Link to="/dashboard" className="mt-6 inline-block text-sm font-semibold text-violet-600 hover:text-violet-700">
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
