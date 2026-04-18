import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import roomAPI from "../services/roomAPI";

const MatchHistory = () => {
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 10;

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const { data } = await roomAPI.get(`/matches/history/me?page=${page}&limit=${limit}`);
        setMatches(data.data.matches);
        setTotal(data.data.total);
      } catch (e) {
        console.error("Failed to fetch match history:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [page]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-[100dvh] bg-[#13121B] text-white font-['Rajdhani'] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_18%_18%,rgba(183,255,42,0.1),transparent_34%),radial-gradient(circle_at_85%_72%,rgba(0,225,255,0.08),transparent_30%)]" />
      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="mb-8 border-b border-[#2f2b45] pb-6">
          <p className="text-[10px] font-semibold text-[#8f8ca3] uppercase tracking-[0.24em] mb-3">battle archive</p>
          <h1 className="text-3xl sm:text-4xl font-[Oxanium] font-black tracking-tight uppercase">Match History</h1>
          <p className="text-[#A9A8B8] text-sm mt-3">Review your past battles</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <span className="w-6 h-6 border-2 border-[#B7FF2A] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center py-16 rounded-3xl bg-[#171624]/95">
            <p className="text-[#A9A8B8] text-sm mb-4">No matches yet. Jump into the arena!</p>
            <button
              onClick={() => navigate("/lobby")}
              className="px-5 py-2 bg-[#B7FF2A] text-[#13121B] text-xs font-semibold uppercase tracking-[0.14em] rounded-full"
            >
              Play Now
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {matches.map((match) => (
                <div
                  key={match._id}
                  className="flex items-center justify-between px-5 py-4 rounded-2xl bg-[#171624]/95 hover:bg-[#1f1d2d] transition-all cursor-pointer group"
                  onClick={() => navigate(`/replay/${match._id}`)}
                >
                  <div>
                    <p className="font-[Oxanium] text-sm font-black tracking-[0.08em] uppercase text-white">{match.gameMode?.replace(/_/g, " ")}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-[#A9A8B8]">
                      <span>{match.playerCount} players</span>
                      <span>·</span>
                      <span>Score: {match.myScore}</span>
                      <span>·</span>
                      <span>
                        {new Date(match.createdAt).toLocaleDateString("en-US", {
                          month: "short", day: "numeric", year: "numeric"
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                      match.isWinner
                        ? "bg-[rgba(183,255,42,0.14)] text-[#B7FF2A]"
                        : "bg-red-500/14 text-red-300"
                    }`}>
                      {match.isWinner ? "VICTORY" : match.wasEliminated ? "ELIMINATED" : "DEFEAT"}
                    </span>
                    <span className="text-xs text-gray-300 group-hover:text-[#B7FF2A] transition-colors font-semibold">
                      View →
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-8">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="text-xs uppercase tracking-[0.14em] text-[#A9A8B8] hover:text-white disabled:opacity-30 transition-colors font-semibold"
                >
                  ← Prev
                </button>
                <span className="text-xs text-[#A9A8B8] font-mono tracking-[0.12em]">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="text-xs uppercase tracking-[0.14em] text-[#A9A8B8] hover:text-white disabled:opacity-30 transition-colors font-semibold"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default MatchHistory;
