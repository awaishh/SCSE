import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import roomAPI from "../services/roomAPI";
import Lenis from "lenis";
import gsap from "gsap";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    roomAPI.get("/matches/stats/me")
      .then(({ data }) => setStats(data.data))
      .catch(() => {}); // silently fail if no matches yet
  }, []);

  useEffect(() => {
    const lenis = new Lenis({ smoothTouch: true, duration: 1.2 });
    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    requestAnimationFrame(raf);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);

    const ctx = gsap.context(() => {
      gsap.from(".dash-anim", {
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.15,
        ease: "power3.out"
      });
    }, containerRef);

    return () => {
      ctx.revert();
      lenis.destroy();
      gsap.ticker.remove((time) => lenis.raf(time * 1000));
    };
  }, []);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
    navigate("/login");
  };

  const StatBox = ({ label, value, sub }) => (
    <div className="bg-[#181827] border border-[#302E46] rounded-xl p-5 shadow-[0_10px_20px_rgba(0,0,0,0.3)]">
      <p className="text-xs font-semibold text-[#A9A8B8] uppercase tracking-wide mb-1 transition-colors">{label}</p>
      <p className="text-2xl font-black text-white">{value}</p>
      {sub && <p className="text-xs text-[#B7FF2A] mt-0.5 font-semibold">{sub}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#13121B] text-white font-['Satoshi']" ref={containerRef}>
      {/* Nav */}
      <nav className="border-b border-[#302E46] px-8 py-5 flex justify-between items-center bg-[#181827]">
        <div className="flex items-center gap-2">
          <span className="font-[Orbitron] font-black tracking-widest text-[#B7FF2A] text-xl">KRYPTCODE</span>
          <span className="font-[Orbitron] font-bold tracking-widest text-white text-xl">ARENA</span>
        </div>
        <div className="flex items-center gap-6">
          <span className="text-sm font-semibold text-[#A9A8B8] hidden sm:block tracking-wide uppercase">
            {user?.name}
          </span>
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="text-xs text-[#A9A8B8] border border-[#302E46] px-4 py-2 rounded-full hover:text-white hover:border-[#A9A8B8] transition-all font-bold tracking-widest disabled:opacity-50 uppercase"
          >
            {loggingOut ? "LEAVING..." : "LOGOUT"}
          </button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-12 space-y-10">

        {/* Welcome */}
        <div className="dash-anim">
          <p className="text-xs font-bold text-[#A9A8B8] uppercase tracking-widest mb-2">Welcome Back to the Arena</p>
          <h1 className="text-4xl font-[Orbitron] font-black text-white tracking-widest uppercase">{user?.name}</h1>
          <p className="text-[#6D6A7E] text-sm mt-1">{user?.email}</p>
        </div>

        {/* Game Mode Cards */}
        <div className="dash-anim">
          <p className="text-xs font-bold font-[Orbitron] text-[#A9A8B8] uppercase tracking-widest mb-4">Choose Your Battle</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              to="/lobby?mode=BLITZ_1V1"
              className="group relative bg-[#181827] border border-[#302E46] hover:border-[#B7FF2A] rounded-xl p-6 transition-all overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#B7FF2A]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <p className="text-3xl mb-3">⚔️</p>
                <p className="text-sm font-[Orbitron] font-black text-white tracking-widest uppercase">BLITZ 1V1</p>
                <p className="text-[10px] text-[#A9A8B8] mt-1 font-semibold">Solo · 2 Players · 15 min</p>
              </div>
            </Link>
            <Link
              to="/lobby?mode=TEAM_DUEL_2V2"
              className="group relative bg-[#181827] border border-[#302E46] hover:border-[#B7FF2A] rounded-xl p-6 transition-all overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#B7FF2A]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <p className="text-3xl mb-3">🤝</p>
                <p className="text-sm font-[Orbitron] font-black text-white tracking-widest uppercase">TEAM 2V2</p>
                <p className="text-[10px] text-[#A9A8B8] mt-1 font-semibold">Teams · 4 Players · 30 min</p>
              </div>
            </Link>
            <Link
              to="/lobby?mode=TEAM_DUEL_3V3"
              className="group relative bg-[#181827] border border-[#302E46] hover:border-[#B7FF2A] rounded-xl p-6 transition-all overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-[#B7FF2A]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative">
                <p className="text-3xl mb-3">🏟️</p>
                <p className="text-sm font-[Orbitron] font-black text-white tracking-widest uppercase">TEAM 3V3</p>
                <p className="text-[10px] text-[#A9A8B8] mt-1 font-semibold">Teams · 6 Players · 30 min</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 dash-anim">
          <StatBox
            label="Rating"
            value={stats?.global?.rating ?? user?.rating ?? 1000}
            sub={stats?.global?.rankTier || "Silver Tier"}
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

        {/* Quick links */}
        <div className="grid grid-cols-3 gap-4 dash-anim">
          <Link to="/match-history" className="bg-[#181827] border border-[#302E46] rounded-xl p-5 text-center hover:border-[#B7FF2A] transition-all group">
            <p className="text-2xl mb-2 group-hover:scale-110 transition-transform">📋</p>
            <p className="text-xs font-bold font-[Orbitron] tracking-widest text-white uppercase">History</p>
          </Link>
          <Link to="/leaderboard" className="bg-[#181827] border border-[#302E46] rounded-xl p-5 text-center hover:border-[#B7FF2A] transition-all group">
            <p className="text-2xl mb-2 group-hover:scale-110 transition-transform">🏆</p>
            <p className="text-xs font-bold font-[Orbitron] tracking-widest text-white uppercase">Rankings</p>
          </Link>
          <Link to="/guild" className="bg-[#181827] border border-[#302E46] rounded-xl p-5 text-center hover:border-[#B7FF2A] transition-all group">
            <p className="text-2xl mb-2 group-hover:scale-110 transition-transform">⚔️</p>
            <p className="text-xs font-bold font-[Orbitron] tracking-widest text-white uppercase">Guild</p>
          </Link>
        </div>

        {/* Recent matches */}
        {stats?.recentMatches?.length > 0 && (
          <div className="dash-anim">
            <p className="text-xs font-bold font-[Orbitron] text-[#A9A8B8] uppercase tracking-widest mb-4">Recent Battles</p>
            <div className="space-y-3">
              {stats.recentMatches.map((m) => (
                <div key={m.matchId} className="flex items-center justify-between px-5 py-4 bg-[#181827] border border-[#302E46] hover:bg-[#1C1A2A] transition-colors rounded-xl">
                  <div>
                    <p className="text-sm font-bold text-white uppercase tracking-wide">{m.gameMode?.replace(/_/g, " ")}</p>
                    <p className="text-[10px] text-[#A9A8B8] mt-1 font-semibold uppercase">{new Date(m.date).toLocaleDateString()}</p>
                  </div>
                  <span className={`text-[10px] font-black px-3 py-1 rounded border tracking-widest uppercase ${
                    m.isWinner ? "bg-[rgba(183,255,42,0.1)] text-[#B7FF2A] border-[rgba(183,255,42,0.2)]" : "bg-red-500/10 text-red-500 border-red-500/20"
                  }`}>
                    {m.isWinner ? "VICTORY" : "DEFEAT"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Security */}
        <div className="bg-[#181827] border border-[#302E46] rounded-xl p-6 flex flex-col sm:flex-row items-center justify-between dash-anim gap-4">
          <div className="text-center sm:text-left">
            <p className="text-sm font-bold font-[Orbitron] tracking-widest text-white uppercase">Two-Factor Auth</p>
            <p className="text-xs text-[#A9A8B8] mt-1 font-semibold">
              {user?.isTwoFactorEnabled ? "SYSTEM SECURED WITH 2FA" : "ACCOUNT AT RISK - ENABLE 2FA"}
            </p>
          </div>
          {user?.isTwoFactorEnabled ? (
            <span className="text-[10px] font-black text-[#13121B] bg-[#B7FF2A] px-4 py-1.5 rounded uppercase tracking-widest outline outline-[1px] outline-offset-2 outline-[#B7FF2A]">ACTIVE</span>
          ) : (
            <Link to="/setup-2fa" className="text-xs font-bold text-[#00FFFF] hover:text-white transition-colors border-b border-[#00FFFF] hover:border-white pb-1 tracking-widest uppercase">
              ENABLE NOW →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
