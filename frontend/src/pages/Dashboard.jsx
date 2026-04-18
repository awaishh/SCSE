import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import roomAPI from "../services/roomAPI";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    roomAPI.get("/matches/stats/me")
      .then(({ data }) => setStats(data.data))
      .catch(() => {}); // silently fail if no matches yet
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    navigate("/login");
  };

  const StatBox = ({ label, value, sub }) => (
    <div className="border border-gray-100 rounded-xl p-5">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-2xl font-black text-[#111827]">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-white text-[#111827]">
      {/* Nav */}
      <nav className="border-b border-gray-100 px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="font-bold">Battle</span>
          <span className="font-bold text-violet-600">Arena</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400 hidden sm:block">
            {user?.name}
          </span>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors font-semibold disabled:opacity-50"
          >
            {loggingOut ? "Leaving..." : "Logout"}
          </button>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-12 space-y-10">

        {/* Welcome */}
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Welcome back</p>
          <h1 className="text-4xl font-black text-[#111827] tracking-tight">{user?.name}</h1>
          <p className="text-gray-400 text-sm mt-1">{user?.email}</p>
        </div>

        {/* Play button */}
        <Link
          to="/lobby"
          className="block w-full bg-[#111827] hover:bg-gray-800 text-white py-4 rounded-xl text-center text-sm font-bold transition-all"
        >
          ⚔️ Play Blitz 1v1
        </Link>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatBox
            label="Rating"
            value={stats?.global?.rating ?? user?.rating ?? 1000}
            sub={stats?.global?.rankTier || "Silver"}
          />
          <StatBox
            label="Matches"
            value={stats?.totalMatches ?? user?.matchCount ?? 0}
          />
          <StatBox
            label="Wins"
            value={stats?.totalWins ?? 0}
          />
          <StatBox
            label="Win Rate"
            value={`${stats?.winRate ?? 0}%`}
          />
        </div>

        {/* Recent matches */}
        {stats?.recentMatches?.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Recent Matches</p>
            <div className="space-y-2">
              {stats.recentMatches.map((m) => (
                <div key={m.matchId} className="flex items-center justify-between px-4 py-3 border border-gray-100 rounded-lg">
                  <div>
                    <p className="text-sm font-semibold">{m.gameMode?.replace(/_/g, " ")}</p>
                    <p className="text-xs text-gray-400">{new Date(m.date).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                    m.isWinner ? "bg-emerald-50 text-emerald-600 border-emerald-100" : "bg-red-50 text-red-500 border-red-100"
                  }`}>
                    {m.isWinner ? "WIN" : "LOSS"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick links */}
        <div className="grid grid-cols-3 gap-3">
          <Link to="/match-history" className="border border-gray-100 rounded-xl p-4 text-center hover:border-gray-200 transition-all">
            <p className="text-lg mb-1">📋</p>
            <p className="text-xs font-semibold text-[#111827]">History</p>
          </Link>
          <Link to="/leaderboard" className="border border-gray-100 rounded-xl p-4 text-center hover:border-gray-200 transition-all">
            <p className="text-lg mb-1">🏆</p>
            <p className="text-xs font-semibold text-[#111827]">Rankings</p>
          </Link>
          <Link to="/guild" className="border border-gray-100 rounded-xl p-4 text-center hover:border-gray-200 transition-all">
            <p className="text-lg mb-1">⚔️</p>
            <p className="text-xs font-semibold text-[#111827]">Guild</p>
          </Link>
        </div>

        {/* Security */}
        <div className="border border-gray-100 rounded-xl p-5 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold">Two-Factor Auth</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {user?.isTwoFactorEnabled ? "Enabled — your account is secured" : "Not enabled"}
            </p>
          </div>
          {user?.isTwoFactorEnabled ? (
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">ON</span>
          ) : (
            <Link to="/setup-2fa" className="text-xs font-bold text-violet-600 hover:text-violet-700 transition-colors">
              Enable →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
