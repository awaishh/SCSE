import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useGuild } from "../context/GuildContext";

const StatCard = ({ label, value }) => (
  <div className="border-b border-[#1e1b4b]/5 pb-4">
    <p className="text-[10px] uppercase tracking-[0.2em] text-[#64748b] mb-1 font-semibold">{label}</p>
    <p className="text-lg font-semibold text-[#1e1b4b]">{value}</p>
  </div>
);

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-white text-[#1e1b4b]">

      {/* ── Navbar ── */}
      <nav className="border-b border-[#1e1b4b]/5 px-8 py-5 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[#6D28D9] text-2xl">auto_stories</span>
          <span className="font-bold tracking-tight text-base uppercase">Battle Arena</span>
        </div>
        <div className="flex items-center gap-6">
          <span className="text-[11px] uppercase tracking-[0.15em] text-[#64748b] hidden sm:block">
            {user?.name || "Player"}
          </span>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="text-[10px] uppercase tracking-[0.2em] text-[#64748b] hover:text-[#6D28D9] transition-colors font-semibold disabled:opacity-50"
          >
            {loggingOut ? "Leaving..." : "Logout"}
          </button>
        </div>
      </nav>

      {/* ── Content ── */}
      <main className="max-w-3xl mx-auto px-8 py-16 space-y-12">

        {/* Welcome */}
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#64748b] mb-2">Welcome back</p>
          <h1 className="serif-heading text-5xl font-bold leading-tight text-[#1e1b4b]">
            {user?.name || "Player"}
          </h1>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <StatCard label="Rating" value={user?.rating ?? 1000} />
          <StatCard label="Matches" value={user?.matchCount ?? 0} />
          <StatCard label="Rank Tier" value="Silver" />
          <StatCard label="Guild" value={user?.guildId ? "Joined" : "None"} />
        </div>

        {/* Profile */}
        <div className="border-t border-[#1e1b4b]/5 pt-10">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#64748b] mb-6 font-semibold">
            Account Details
          </p>
          <div className="space-y-5">
            <div className="flex justify-between items-center border-b border-[#1e1b4b]/5 pb-4">
              <span className="text-[11px] uppercase tracking-[0.15em] text-[#64748b]">Email</span>
              <span className="text-sm font-medium">{user?.email || "—"}</span>
            </div>
            <div className="flex justify-between items-center border-b border-[#1e1b4b]/5 pb-4">
              <span className="text-[11px] uppercase tracking-[0.15em] text-[#64748b]">Two-Factor Auth</span>
              {user?.isTwoFactorEnabled ? (
                <span className="text-[10px] uppercase tracking-[0.15em] text-green-600 font-bold">Enabled</span>
              ) : (
                <Link
                  to="/setup-2fa"
                  className="text-[10px] uppercase tracking-[0.15em] text-[#6D28D9] font-bold hover:opacity-70 transition-opacity"
                >
                  Enable →
                </Link>
              )}
            </div>
            <div className="flex justify-between items-center border-b border-[#1e1b4b]/5 pb-4">
              <span className="text-[11px] uppercase tracking-[0.15em] text-[#64748b]">Auth Method</span>
              <span className="text-sm font-medium">
                {user?.googleId ? "Google" : user?.githubId ? "GitHub" : "Email"}
              </span>
            </div>
          </div>
        </div>

        {/* Coming soon */}
        <div className="border border-[#1e1b4b]/5 rounded-sm p-8">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#64748b] mb-3 font-semibold">
            Quick Actions
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/lobby"
              className="px-5 py-2.5 bg-[#111827] text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition-colors"
            >
              Play Now
            </Link>
            <Link
              to="/guild"
              className="px-5 py-2.5 border border-[#1e1b4b]/10 text-sm font-semibold rounded-lg hover:border-[#6D28D9] hover:text-[#6D28D9] transition-colors"
            >
              Guilds
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
