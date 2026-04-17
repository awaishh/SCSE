import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import Button from "../components/UI/Button";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
  };

  return (
    <div className="min-h-screen w-full bg-gray-950 text-white">
      {/* Navbar */}
      <nav className="bg-gray-900 border-b border-gray-800 px-6 py-4 flex justify-between items-center">
        <span className="text-xl font-bold text-white">⚔️ Battle Arena</span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400 hidden sm:block">
            Welcome, <span className="font-semibold text-white">{user?.name || "Player"}</span>
          </span>
          <Button
            variant="danger"
            className="w-auto py-1.5 px-4 text-sm"
            loading={loggingOut}
            onClick={handleLogout}
          >
            Logout
          </Button>
        </div>
      </nav>

      {/* Main content */}
      <main className="max-w-3xl mx-auto p-6 space-y-6">

        {/* Profile card */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
          <h2 className="text-lg font-bold mb-4 text-gray-200">Your Profile</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Name</p>
              <p className="text-white font-medium">{user?.name || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Email</p>
              <p className="text-white font-medium">{user?.email || "—"}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Rating</p>
              <p className="text-white font-medium">{user?.rating ?? 1000}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Matches Played</p>
              <p className="text-white font-medium">{user?.matchCount ?? 0}</p>
            </div>
          </div>
        </div>

        {/* Security card */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
          <h2 className="text-lg font-bold mb-4 text-gray-200">Security</h2>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Two-Factor Authentication</p>
              <p className="text-sm text-gray-400 mt-0.5">
                {user?.isTwoFactorEnabled
                  ? "Your account is protected with 2FA."
                  : "Add an extra layer of security to your account."}
              </p>
            </div>
            {user?.isTwoFactorEnabled ? (
              <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded-full border border-green-500/30">
                ENABLED
              </span>
            ) : (
              <Link to="/setup-2fa">
                <Button variant="primary" className="w-auto px-4 py-2 text-sm">
                  Enable 2FA
                </Button>
              </Link>
            )}
          </div>
        </div>

        {/* Session info */}
        <div className="bg-blue-950/40 rounded-2xl border border-blue-800/30 p-6">
          <h2 className="text-sm font-bold text-blue-300 mb-2">Session Info</h2>
          <p className="text-sm text-blue-400">
            Authenticated via JWT. Access tokens expire in 15 minutes and are refreshed automatically via HTTP-only cookies.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
