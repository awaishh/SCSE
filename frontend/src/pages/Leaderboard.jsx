import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();

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
    <div className="min-h-screen bg-[#13121B] text-white font-['Satoshi']">
      {/* Nav */}
      <nav className="border-b border-[#302E46] px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="font-bold">Battle</span>
          <span className="font-bold text-[#B7FF2A]">Arena</span>
          <span className="mx-2 text-gray-200">|</span>
          <span className="text-sm text-[#A9A8B8]">Rankings</span>
        </div>
        <button onClick={() => navigate("/dashboard")} className="text-xs text-[#A9A8B8] hover:text-white transition-colors">
          ← Dashboard
        </button>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Global Rankings</h1>
          <p className="text-[#A9A8B8] text-sm mt-1">The most elite coders in the Arena</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <span className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : leaders.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-[#302E46] rounded-xl">
            <p className="text-[#A9A8B8] text-sm">No rankings yet. Complete matches to appear!</p>
          </div>
        ) : (
          <div className="border border-[#302E46] rounded-xl overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-[#1C1A2A] border-b border-[#302E46] text-xs font-semibold text-[#A9A8B8] uppercase tracking-wide">
              <div className="col-span-1 text-center">#</div>
              <div className="col-span-4">Player</div>
              <div className="col-span-2 text-center">Rank</div>
              <div className="col-span-2 text-right">Rating</div>
              <div className="col-span-1 text-right">W</div>
              <div className="col-span-1 text-right">L</div>
              <div className="col-span-1 text-right">WR%</div>
            </div>

            {/* Table Body */}
            <div className="divide-y divide-gray-100">
              {leaders.map((player, index) => (
                <div 
                  key={player.id} 
                  className={`grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-[#1C1A2A] transition-colors ${
                    index < 3 ? "bg-violet-50/30" : ""
                  }`}
                >
                  <div className="col-span-1 flex justify-center">
                    <span className={`text-sm font-black ${
                      index === 0 ? "text-amber-500" : index === 1 ? "text-[#A9A8B8]" : index === 2 ? "text-amber-700" : "text-gray-300"
                    }`}>
                      {index + 1}
                    </span>
                  </div>
                  <div className="col-span-4 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-[#A9A8B8]">
                      {player.name[0]}
                    </div>
                    <span className="font-bold text-white">{player.name}</span>
                  </div>
                  <div className="col-span-2 flex justify-center">
                    <span className={`text-xs font-bold ${RANK_COLORS[player.rankTier] || "text-[#A9A8B8]"}`}>
                      {player.rankTier}
                    </span>
                  </div>
                  <div className="col-span-2 text-right font-mono font-bold text-[#B7FF2A]">
                    {player.rating}
                  </div>
                  <div className="col-span-1 text-right text-[#B7FF2A] font-semibold text-sm">
                    {player.wins}
                  </div>
                  <div className="col-span-1 text-right text-red-500 font-semibold text-sm">
                    {player.losses}
                  </div>
                  <div className="col-span-1 text-right font-bold text-sm text-white">
                    {player.winRate}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;
