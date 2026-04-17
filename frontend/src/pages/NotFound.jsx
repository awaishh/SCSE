import { Link } from "react-router-dom";

const NotFound = () => (
  <div className="min-h-screen w-full flex items-center justify-center bg-white text-[#1e1b4b]">
    <div className="text-center">
      <p className="serif-heading text-[120px] font-bold leading-none text-[#1e1b4b]/5">404</p>
      <h1 className="text-2xl font-bold tracking-[0.2em] uppercase -mt-4">Page Not Found</h1>
      <p className="text-[11px] uppercase tracking-[0.2em] text-[#64748b] mt-3">
        The page you're looking for doesn't exist.
      </p>
      <Link
        to="/login"
        className="inline-block mt-8 text-[10px] uppercase tracking-[0.2em] text-[#6D28D9] font-bold hover:opacity-70 transition-opacity"
      >
        ← Return to Login
      </Link>
    </div>
  </div>
);

export default NotFound;
