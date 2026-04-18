import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import roomAPI from "../services/roomAPI";
import gsap from "gsap";

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    roomAPI.get("/matches/stats/me")
      .then(({ data }) => setStats(data.data))
      .catch(() => {}); // silently fail if no matches yet
  }, []);

  useEffect(() => {
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
    };
  }, []);

  const StatBox = ({ label, value, sub }) => (
    <div className="px-4 py-3">
      <p className="text-[10px] font-semibold text-[#8f8ca3] uppercase tracking-[0.22em] mb-1">{label}</p>
      <p className="text-3xl font-black text-white leading-none">{value}</p>
      {sub && <p className="text-xs text-[#B7FF2A] mt-2 font-semibold uppercase tracking-[0.16em]">{sub}</p>}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#13121B] text-white font-['Rajdhani'] relative overflow-hidden" ref={containerRef}>
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_18%_20%,rgba(183,255,42,0.1),transparent_35%),radial-gradient(circle_at_85%_78%,rgba(0,225,255,0.08),transparent_32%)]" />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-10">

        <section className="dash-anim grid gap-8 lg:grid-cols-[1.6fr_1fr] items-end border-b border-[#2f2b45] pb-8">
          <div>
            <p className="text-[10px] font-semibold text-[#8f8ca3] uppercase tracking-[0.24em] mb-4">command center</p>
            <h1 className="text-4xl sm:text-5xl font-[Oxanium] font-black tracking-tight uppercase leading-[0.92]">
              {user?.name || "Player"}
            </h1>
            <p className="text-sm text-[#8e8aa1] mt-3 max-w-[60ch]">{user?.email}</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 lg:justify-end">
            <Link to="/match-history" className="px-4 py-2 rounded-full text-xs uppercase tracking-[0.16em] font-bold bg-[#1b1a29] hover:bg-[#232137] transition-colors text-[#d7d5e3]">
              history
            </Link>
            <Link to="/leaderboard" className="px-4 py-2 rounded-full text-xs uppercase tracking-[0.16em] font-bold bg-[#1b1a29] hover:bg-[#232137] transition-colors text-[#d7d5e3]">
              rankings
            </Link>
            <Link to="/guild" className="px-4 py-2 rounded-full text-xs uppercase tracking-[0.16em] font-bold bg-[#1b1a29] hover:bg-[#232137] transition-colors text-[#d7d5e3]">
              guild
            </Link>
          </div>
        </section>

        <section className="dash-anim">
          <p className="text-[10px] font-semibold text-[#8f8ca3] uppercase tracking-[0.24em] mb-4">choose your battle</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/lobby?mode=BLITZ_1V1" className="group relative overflow-hidden rounded-3xl p-[1px] bg-gradient-to-br from-[#4f4a67] to-[#222033] hover:from-[#b7ff2a]/80 hover:to-[#3b3652] transition-all duration-300">
              <div className="rounded-[calc(1.5rem-1px)] bg-[#181827]/95 p-6 min-h-[170px]">
                <p className="text-[11px] uppercase tracking-[0.2em] text-[#8f8ca3]">solo queue</p>
                <p className="text-2xl font-[Oxanium] font-black mt-3">BLITZ 1V1</p>
                <p className="text-xs text-[#9f9ab4] mt-3">Two players. Fast rounds. Pure speed and accuracy.</p>
              </div>
            </Link>
            <Link to="/lobby?mode=TEAM_DUEL_2V2" className="group relative overflow-hidden rounded-3xl p-[1px] bg-gradient-to-br from-[#4f4a67] to-[#222033] hover:from-[#b7ff2a]/80 hover:to-[#3b3652] transition-all duration-300">
              <div className="rounded-[calc(1.5rem-1px)] bg-[#181827]/95 p-6 min-h-[170px]">
                <p className="text-[11px] uppercase tracking-[0.2em] text-[#8f8ca3]">squad mode</p>
                <p className="text-2xl font-[Oxanium] font-black mt-3">TEAM 2V2</p>
                <p className="text-xs text-[#9f9ab4] mt-3">Coordinate with one teammate and outsolve the other side.</p>
              </div>
            </Link>
            <Link to="/lobby?mode=TEAM_DUEL_3V3" className="group relative overflow-hidden rounded-3xl p-[1px] bg-gradient-to-br from-[#4f4a67] to-[#222033] hover:from-[#b7ff2a]/80 hover:to-[#3b3652] transition-all duration-300">
              <div className="rounded-[calc(1.5rem-1px)] bg-[#181827]/95 p-6 min-h-[170px]">
                <p className="text-[11px] uppercase tracking-[0.2em] text-[#8f8ca3]">pro circuit</p>
                <p className="text-2xl font-[Oxanium] font-black mt-3">TEAM 3V3</p>
                <p className="text-xs text-[#9f9ab4] mt-3">Six-player tactical battles designed for high pressure play.</p>
              </div>
            </Link>
          </div>
        </section>

        <section className="dash-anim rounded-3xl p-[1px] bg-gradient-to-r from-[#3f3a56] to-[#262337]">
          <div className="rounded-[calc(1.5rem-1px)] bg-[#171624]/95 grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-[#2f2b45]">
            <StatBox
              label="Rating"
              value={stats?.global?.rating ?? user?.rating ?? 1000}
              sub={stats?.global?.rankTier || "Silver Tier"}
            />
            <StatBox label="Matches" value={stats?.totalMatches ?? user?.matchCount ?? 0} />
            <StatBox label="Wins" value={stats?.totalWins ?? 0} />
            <StatBox label="Win Rate" value={`${stats?.winRate ?? 0}%`} />
          </div>
        </section>

        {stats?.recentMatches?.length > 0 && (
          <section className="dash-anim">
            <div className="flex items-end justify-between mb-4">
              <p className="text-[10px] font-semibold text-[#8f8ca3] uppercase tracking-[0.24em]">recent battles</p>
              <Link to="/match-history" className="text-xs uppercase tracking-[0.16em] text-[#b7ff2a] font-semibold">view all</Link>
            </div>
            <div className="rounded-3xl p-[1px] bg-gradient-to-br from-[#3f3a56] to-[#262337]">
              <div className="rounded-[calc(1.5rem-1px)] bg-[#171624]/95 divide-y divide-[#2f2b45]">
                {stats.recentMatches.map((m) => (
                  <div key={m.matchId} className="flex items-center justify-between gap-4 px-5 py-4">
                    <div>
                      <p className="text-sm font-bold text-white uppercase tracking-[0.08em]">{m.gameMode?.replace(/_/g, " ")}</p>
                      <p className="text-[10px] text-[#9f9ab4] mt-1 font-semibold uppercase tracking-[0.18em]">{new Date(m.date).toLocaleDateString()}</p>
                    </div>
                    <span className={`text-[10px] font-black px-3 py-1 rounded-full tracking-[0.18em] uppercase ${
                      m.isWinner ? "bg-[rgba(183,255,42,0.12)] text-[#B7FF2A]" : "bg-red-500/12 text-red-400"
                    }`}>
                      {m.isWinner ? "VICTORY" : "DEFEAT"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="dash-anim border-t border-[#2f2b45] pt-7 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold text-[#8f8ca3] uppercase tracking-[0.24em]">security status</p>
            <p className="text-sm text-[#d7d4e5] mt-2 uppercase tracking-[0.08em] font-semibold">
              {user?.isTwoFactorEnabled ? "2FA enabled for this account" : "2FA is disabled"}
            </p>
          </div>
          {user?.isTwoFactorEnabled ? (
            <span className="text-[10px] font-black text-[#13121B] bg-[#B7FF2A] px-4 py-1.5 rounded-full uppercase tracking-[0.18em]">ACTIVE</span>
          ) : (
            <Link to="/setup-2fa" className="text-xs font-bold text-[#b7ff2a] hover:text-white transition-colors uppercase tracking-[0.2em]">
              Enable now
            </Link>
          )}
        </section>
      </div>
    </div>
  );
};

export default Dashboard;
