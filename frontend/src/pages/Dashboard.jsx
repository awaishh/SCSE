import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import roomAPI from "../services/roomAPI";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await roomAPI.get("/matches/stats/me");
        setStats(data.data);
      } catch (e) {
        console.error("Failed to fetch dashboard stats:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const rankTier = stats?.global?.rankTier || "Silver";
  const rating = stats?.global?.rating ?? user?.rating ?? 1000;

  return (
    <div className="min-h-screen bg-white text-[#111827] font-sans">
      {/* Navbar */}
      <nav className="border-b border-gray-100 px-8 py-4 flex justify-between items-center bg-white sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <span className="font-bold">Battle</span>
          <span className="font-bold text-violet-600">Arena</span>
        </div>
        <div className="flex items-center gap-6">
          <Link to="/leaderboard" className="text-sm font-semibold text-gray-500 hover:text-[#111827] transition-colors">Rankings</Link>
          <Link to="/lobby" className="text-sm font-semibold text-gray-500 hover:text-[#111827] transition-colors">Play</Link>
          <Link to="/guild" className="text-sm font-semibold text-gray-500 hover:text-[#111827] transition-colors">Guilds</Link>
          <button onClick={handleLogout} className="text-sm font-semibold text-red-500 hover:text-red-600 transition-colors">
            Logout
          </button>
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-12 space-y-8">

        {/* Header / Welcome */}
        <div className="flex items-end justify-between border-b border-gray-100 pb-8">
          <div>
            <h1 className="text-4xl font-black tracking-tight text-[#111827]">
              Welcome back, {user?.name || "Player"}
            </h1>
            <p className="text-gray-500 mt-2">Check your latest stats and jump into the next battle.</p>
          </div>
          <Link
            to="/lobby"
            className="px-8 py-3 bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold rounded-lg transition-all"
          >
            Play Now
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Matches", value: stats?.totalMatches ?? 0 },
            { label: "Wins", value: stats?.totalWins ?? 0 },
            { label: "Win Rate", value: `${stats?.winRate ?? 0}%` },
            { label: "Win Streak", value: stats?.currentStreak ?? 0 },
          ].map((stat) => (
            <div key={stat.label} className="bg-gray-50 border border-gray-100 rounded-xl p-6">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{stat.label}</p>
              <p className="text-3xl font-black text-[#111827]">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Recent Matches */}
          <div className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-[#111827]">Recent Matches</h2>
              <Link to="/match-history" className="text-sm font-semibold text-violet-600 hover:text-violet-700">
                View All →
              </Link>
            </div>

            <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
              {loading ? (
                <div className="p-10 flex justify-center">
                  <span className="w-6 h-6 border-2 border-gray-300 border-t-violet-600 rounded-full animate-spin" />
                </div>
              ) : stats?.recentMatches?.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {stats.recentMatches.map((match) => (
                    <div
                      key={match.matchId}
                      className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors cursor-pointer"
                      onClick={() => navigate(`/replay/${match.matchId}`)}
                    >
                      <div>
                        <p className="font-bold text-[#111827]">{match.gameMode?.replace(/_/g, " ")}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{new Date(match.date).toLocaleDateString()}</p>
                      </div>
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                        match.isWinner ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-red-50 text-red-600 border border-red-100"
                      }`}>
                        {match.isWinner ? "WIN" : "LOSS"}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-10 text-center">
                  <p className="text-sm text-gray-500">No matches yet. Jump into the arena!</p>
                </div>
              )}
            </div>
          </div>

          {/* Account Details & Rankings */}
          <div className="space-y-6">

            {/* Rank Box */}
            <div className="bg-white border border-gray-100 rounded-xl p-6 text-center">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Current Rank</p>
              <h3 className="text-2xl font-black text-[#111827] mb-1">{rankTier}</h3>
              <p className="text-sm font-bold text-violet-600">{rating} ELO</p>
            </div>

            {/* Account Settings */}
            <div className="bg-white border border-gray-100 rounded-xl p-6">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Account</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-[#111827]">Email</span>
                  <span className="text-gray-500">{user?.email}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-medium text-[#111827]">2FA Security</span>
                  {user?.isTwoFactorEnabled ? (
                    <span className="text-xs font-bold bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-100">Enabled</span>
                  ) : (
                    <Link to="/setup-2fa" className="text-xs font-bold text-violet-600 hover:text-violet-700">Enable 2FA</Link>
                  )}
                </div>
              </div>
            </div>

            {/* Per-Mode Ratings */}
            {stats?.modeStats?.length > 0 && (
              <div className="bg-white border border-gray-100 rounded-xl p-6">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">Mode Ratings</h3>
                <div className="space-y-3">
                  {stats.modeStats.map((ms) => (
                    <div key={ms.mode} className="flex justify-between items-center">
                      <span className="text-sm font-medium text-[#111827]">{ms.mode.replace(/_/g, " ")}</span>
                      <div className="text-right">
                        <p className="text-sm font-bold text-violet-600">{ms.rating}</p>
                        <p className="text-[10px] text-gray-500 uppercase">{ms.rankTier}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
