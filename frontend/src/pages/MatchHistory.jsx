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
    <div className="min-h-screen bg-[#13121B] text-white font-['Satoshi']">
      {/* Nav */}
      <nav className="border-b border-[#302E46] px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="font-bold">Battle</span>
          <span className="font-bold text-[#B7FF2A]">Arena</span>
          <span className="mx-2 text-gray-200">|</span>
          <span className="text-sm text-[#A9A8B8]">Match History</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-xs text-[#A9A8B8]">{total} total matches</span>
          <button onClick={() => navigate("/dashboard")} className="text-xs text-[#A9A8B8] hover:text-white transition-colors">
            ← Dashboard
          </button>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Match History</h1>
          <p className="text-[#A9A8B8] text-sm mt-1">Review your past battles</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <span className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-[#302E46] rounded-xl">
            <p className="text-[#A9A8B8] text-sm mb-4">No matches yet. Jump into the arena!</p>
            <button
              onClick={() => navigate("/lobby")}
              className="px-4 py-2 bg-[#B7FF2A] text-[#13121B] text-sm font-semibold rounded-lg"
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
                  className="flex items-center justify-between px-5 py-4 border border-[#302E46] rounded-xl hover:border-[#302E46] transition-all cursor-pointer group"
                  onClick={() => navigate(`/replay/${match._id}`)}
                >
                  <div>
                    <p className="font-bold text-white">{match.gameMode?.replace(/_/g, " ")}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-[#A9A8B8]">
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
                        ? "bg-[rgba(183,255,42,0.1)] text-[#B7FF2A] border border-[rgba(183,255,42,0.2)]"
                        : "bg-red-50 text-red-500 border border-red-100"
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
                  className="text-sm text-[#A9A8B8] hover:text-white disabled:opacity-30 transition-colors font-semibold"
                >
                  ← Prev
                </button>
                <span className="text-sm text-[#A9A8B8] font-mono">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="text-sm text-[#A9A8B8] hover:text-white disabled:opacity-30 transition-colors font-semibold"
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
