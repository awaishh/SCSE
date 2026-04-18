import { useState, useEffect } from "react";
import roomAPI from "../services/roomAPI";

const RANK_COLORS = {
  Bronze: "text-amber-700",
  Silver: "text-[#A9A8B8]",
  Gold: "text-yellow-500",
  Platinum: "text-cyan-500",
  Diamond: "text-blue-500",
  Grandmaster: "text-red-500",
};

const Leaderboard = () => {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);

  const topThree = leaders.slice(0, 3);
  const totalPlayers = leaders.length;

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const { data } = await roomAPI.get("/leaderboard/global");
        const formattedLeaders = (data.data.data || []).map((entry) => ({
          id: entry.userId?._id || entry._id,
          name: entry.userId?.name || "Unknown",
          rating: entry.rating,
          rankTier: entry.rankTier || "Silver",
          matches: entry.matchCount || 0,
          wins: entry.wins || 0,
          losses: entry.losses || 0,
          winRate: entry.matchCount > 0 
            ? `${Math.round((entry.wins / entry.matchCount) * 100)}%` 
            : "0%",
        }));
        setLeaders(formattedLeaders);
      } catch (error) {
        console.error("Failed to fetch leaderboard:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  return (
    <div className="min-h-[100dvh] bg-[#13121B] text-white font-['Rajdhani'] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_18%_18%,rgba(183,255,42,0.1),transparent_34%),radial-gradient(circle_at_82%_72%,rgba(0,225,255,0.08),transparent_30%)]" />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="mb-8 border-b border-[#2f2b45] pb-6">
          <p className="text-[10px] font-semibold text-[#8f8ca3] uppercase tracking-[0.24em] mb-3">season standings</p>
          <h1 className="text-3xl sm:text-4xl font-[Oxanium] font-black tracking-tight uppercase">Global Rankings</h1>
          <p className="text-[#A9A8B8] text-sm mt-3">The most elite coders in the Arena</p>
          {!loading && totalPlayers > 0 && (
            <p className="text-[11px] text-[#8f8ca3] uppercase tracking-[0.2em] mt-4">{totalPlayers} competitors ranked</p>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <span className="w-6 h-6 border-2 border-[#B7FF2A] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : leaders.length === 0 ? (
          <div className="text-center py-20 rounded-3xl bg-[#171624]/95">
            <p className="text-[#A9A8B8] text-sm">No rankings yet. Complete matches to appear!</p>
          </div>
        ) : (
          <div className="space-y-7">
            {topThree.length > 0 && (
              <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {topThree.map((player, index) => (
                  <div
                    key={player.id}
                    className={`rounded-3xl p-[1px] ${
                      index === 0
                        ? "bg-gradient-to-br from-[#b7ff2a] via-[#7cbc23] to-[#2e3f16]"
                        : index === 1
                        ? "bg-gradient-to-br from-[#d9dee8] via-[#888f9d] to-[#333847]"
                        : "bg-gradient-to-br from-[#f2c890] via-[#8f6a41] to-[#3e2d1f]"
                    }`}
                  >
                    <div className="rounded-[calc(1.5rem-1px)] bg-[#161522]/95 p-5 h-full">
                      <p className="text-[10px] uppercase tracking-[0.2em] text-[#9f9ab4]">rank {index + 1}</p>
                      <p className="text-xl font-[Oxanium] font-black tracking-[0.05em] mt-3 truncate">{player.name}</p>
                      <p className="text-xs text-[#9f9ab4] mt-1 uppercase tracking-[0.15em]">{player.rankTier}</p>
                      <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="text-[10px] text-[#8f8ca3] uppercase tracking-[0.16em]">ELO</p>
                          <p className="text-base font-mono font-bold text-[#B7FF2A] mt-1">{player.rating}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-[#8f8ca3] uppercase tracking-[0.16em]">W</p>
                          <p className="text-base font-bold text-[#d9f8a2] mt-1">{player.wins}</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-[#8f8ca3] uppercase tracking-[0.16em]">WR</p>
                          <p className="text-base font-bold text-white mt-1">{player.winRate}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </section>
            )}

            <section className="rounded-3xl p-[1px] bg-gradient-to-br from-[#3f3a56] to-[#262337]">
              <div className="rounded-[calc(1.5rem-1px)] bg-[#171624]/95 overflow-hidden">
                <div className="grid grid-cols-12 gap-4 px-6 py-3 border-b border-[#302E46] text-[10px] font-semibold text-[#A9A8B8] uppercase tracking-[0.2em]">
                  <div className="col-span-1 text-center">#</div>
                  <div className="col-span-4">Player</div>
                  <div className="col-span-2 text-center">Tier</div>
                  <div className="col-span-2 text-right">Rating</div>
                  <div className="col-span-1 text-right">W</div>
                  <div className="col-span-1 text-right">L</div>
                  <div className="col-span-1 text-right">WR%</div>
                </div>

                <div className="divide-y divide-[#2f2b45]">
                  {leaders.map((player, index) => (
                    <div
                      key={player.id}
                      className={`grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-[#1f1d2d] transition-colors ${
                        index < 3 ? "bg-[linear-gradient(90deg,rgba(183,255,42,0.08),transparent)]" : ""
                      }`}
                    >
                      <div className="col-span-1 flex justify-center">
                        <span className={`text-sm font-black ${
                          index === 0 ? "text-amber-500" : index === 1 ? "text-[#d9dee8]" : index === 2 ? "text-[#f2c890]" : "text-gray-300"
                        }`}>
                          {index + 1}
                        </span>
                      </div>
                      <div className="col-span-4 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#2a273d] flex items-center justify-center text-xs font-bold text-[#d0cee0]">
                          {player.name[0]}
                        </div>
                        <span className="font-bold text-white truncate">{player.name}</span>
                      </div>
                      <div className="col-span-2 flex justify-center">
                        <span className={`text-xs font-bold uppercase tracking-[0.1em] ${RANK_COLORS[player.rankTier] || "text-[#A9A8B8]"}`}>
                          {player.rankTier}
                        </span>
                      </div>
                      <div className="col-span-2 text-right font-mono font-bold text-[#B7FF2A]">
                        {player.rating}
                      </div>
                      <div className="col-span-1 text-right text-[#B7FF2A] font-semibold text-sm">{player.wins}</div>
                      <div className="col-span-1 text-right text-red-400 font-semibold text-sm">{player.losses}</div>
                      <div className="col-span-1 text-right font-bold text-sm text-white">{player.winRate}</div>
                    </div>
                  ))}
                </div>
            </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
