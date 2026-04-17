import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import roomAPI from "../services/roomAPI";
import { motion } from "framer-motion";

const Replay = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [replayData, setReplayData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Playback State
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0); // in ms
  const [maxTime, setMaxTime] = useState(1000);

  const timerRef = useRef(null);

  useEffect(() => {
    const fetchReplay = async () => {
      try {
        const { data } = await roomAPI.get(`/replay/${matchId}`);
        const replay = data.data;
        setReplayData(replay);

        if (replay.events && replay.events.length > 0) {
          setMaxTime(replay.events[replay.events.length - 1].offsetMs || 1000);
        }
      } catch (err) {
        console.error("Failed to fetch replay:", err);
        setError(err.response?.data?.message || "Failed to load replay");
      } finally {
        setLoading(false);
      }
    };

    fetchReplay();
  }, [matchId]);

  // Playback timer
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= maxTime) {
            setIsPlaying(false);
            return maxTime;
          }
          return prev + 500; // 0.5s steps for smoother playback
        });
      }, 500);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [isPlaying, maxTime]);

  const togglePlay = () => {
    if (currentTime >= maxTime) setCurrentTime(0);
    setIsPlaying(!isPlaying);
  };

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const m = Math.floor(totalSeconds / 60);
    const s = totalSeconds % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  // Get events that have occurred up to currentTime
  const visibleEvents = replayData?.events?.filter(
    (e) => e.offsetMs <= currentTime
  ) || [];

  // Get the event icon and color based on type
  const getEventStyle = (type) => {
    switch (type) {
      case "SUBMISSION":
      case "submission":
        return { icon: "📝", color: "bg-violet-100 text-violet-700 border-violet-200" };
      case "elimination":
        return { icon: "💀", color: "bg-red-100 text-red-700 border-red-200" };
      case "stage_advance":
        return { icon: "⬆️", color: "bg-emerald-100 text-emerald-700 border-emerald-200" };
      case "match_start":
        return { icon: "🏁", color: "bg-blue-100 text-blue-700 border-blue-200" };
      case "match_end":
        return { icon: "🏆", color: "bg-yellow-100 text-yellow-700 border-yellow-200" };
      case "scoreboard_snapshot":
        return { icon: "📊", color: "bg-gray-100 text-gray-700 border-gray-200" };
      default:
        return { icon: "📌", color: "bg-gray-100 text-gray-600 border-gray-200" };
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 text-sm">Loading replay...</p>
        </div>
      </div>
    );
  }

  // Error / Not Found state
  if (error || !replayData) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🎬</span>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">
            Replay Not Available
          </h2>
          <p className="text-gray-500 text-sm max-w-sm">
            {error || "This match replay hasn't been finalized yet. It will be available after the match ends."}
          </p>
          <button
            onClick={() => navigate("/dashboard")}
            className="mt-6 px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 flex flex-col font-sans">
      {/* Header */}
      <motion.header
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm"
      >
        <div className="flex items-center gap-4">
          <span className="text-lg font-bold text-violet-600">🎬 Match Replay</span>
          <span className="text-xs text-gray-400 font-mono bg-gray-100 px-2 py-1 rounded">
            {matchId?.slice(0, 8)}...
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">
            {replayData.events?.length || 0} events recorded
          </span>
          <button
            onClick={() => navigate("/dashboard")}
            className="text-sm text-gray-500 hover:text-violet-600 font-medium transition-colors"
          >
            ← Exit Replay
          </button>
        </div>
      </motion.header>

      <div className="flex-1 flex flex-col lg:flex-row p-6 gap-6 max-w-7xl mx-auto w-full">
        {/* Left: Event Timeline */}
        <motion.div
          initial={{ x: -30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="lg:w-2/5 flex flex-col bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden"
        >
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
              Match Timeline
            </h3>
            <p className="text-xs text-gray-400 mt-1">
              Events replay as the timer advances
            </p>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2 max-h-[60vh]">
            {replayData.events?.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">
                No events were recorded for this match.
              </p>
            ) : (
              replayData.events.map((event, idx) => {
                const isVisible = event.offsetMs <= currentTime;
                const style = getEventStyle(event.type);
                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{
                      opacity: isVisible ? 1 : 0.3,
                      x: 0,
                    }}
                    transition={{ duration: 0.2 }}
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-all ${
                      isVisible ? style.color : "bg-gray-50 text-gray-400 border-gray-100"
                    }`}
                  >
                    <span className="text-lg mt-0.5">{style.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider">
                          {event.type.replace(/_/g, " ")}
                        </span>
                        <span className="text-[10px] font-mono opacity-70">
                          {formatTime(event.offsetMs)}
                        </span>
                      </div>
                      {event.userId?.name && (
                        <p className="text-xs mt-0.5 opacity-80">
                          by {event.userId.name}
                        </p>
                      )}
                      {event.data?.verdict && (
                        <span
                          className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            event.data.verdict === "Accepted"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-red-100 text-red-700"
                          }`}
                        >
                          {event.data.verdict.replace(/_/g, " ")}
                        </span>
                      )}
                      {event.data?.reason && (
                        <p className="text-[10px] mt-1 opacity-60">
                          Reason: {event.data.reason}
                        </p>
                      )}
                      {event.data?.gameMode && (
                        <p className="text-[10px] mt-1 opacity-60">
                          Mode: {event.data.gameMode.replace(/_/g, " ")}
                        </p>
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </motion.div>

        {/* Right: Final Scoreboard + Info */}
        <motion.div
          initial={{ x: 30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="lg:w-3/5 flex flex-col gap-6"
        >
          {/* Final Scoreboard */}
          {replayData.finalScoreboard && (
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gray-50">
                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">
                  🏆 Final Standings
                </h3>
              </div>
              <div className="p-4 space-y-2">
                {(Array.isArray(replayData.finalScoreboard)
                  ? replayData.finalScoreboard
                  : []
                ).map((player, idx) => (
                  <div
                    key={player.userId?._id || player.userId || idx}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      idx === 0
                        ? "bg-yellow-50 border-yellow-200"
                        : idx === 1
                        ? "bg-gray-50 border-gray-200"
                        : idx === 2
                        ? "bg-orange-50 border-orange-200"
                        : "bg-white border-gray-100"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg w-8 text-center">
                        {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
                      </span>
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                        {(player.userId?.name || "P")?.[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">
                          {player.userId?.name || `Player ${idx + 1}`}
                        </p>
                        <p className="text-[10px] text-gray-400">
                          Stage {player.currentStage || 0} • {player.wrongAttempts || 0} wrong
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-violet-600">
                        {player.score || 0} pts
                      </p>
                      {!player.isAlive && (
                        <p className="text-[10px] text-red-500 font-medium">Eliminated</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Match Stats Summary */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-4">
              Match Stats
            </h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-violet-50 rounded-lg border border-violet-100">
                <p className="text-2xl font-bold text-violet-600">
                  {replayData.events?.filter((e) => e.type === "SUBMISSION" || e.type === "submission").length || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">Submissions</p>
              </div>
              <div className="text-center p-4 bg-emerald-50 rounded-lg border border-emerald-100">
                <p className="text-2xl font-bold text-emerald-600">
                  {replayData.events?.filter(
                    (e) => (e.type === "SUBMISSION" || e.type === "submission") && e.data?.verdict === "Accepted"
                  ).length || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">Accepted</p>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg border border-red-100">
                <p className="text-2xl font-bold text-red-600">
                  {replayData.events?.filter((e) => e.type === "elimination").length || 0}
                </p>
                <p className="text-xs text-gray-500 mt-1">Eliminations</p>
              </div>
            </div>
          </div>

          {/* Playback info */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 text-center text-sm text-gray-500">
            <p>
              Use the timeline controls below to step through match events.
              Events will appear on the left panel as the timer advances.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Bottom Playback Controls */}
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="h-24 bg-white border-t border-gray-200 px-6 flex flex-col justify-center gap-2 shadow-lg"
      >
        {/* Timeline Slider */}
        <input
          type="range"
          min="0"
          max={maxTime}
          value={currentTime}
          onChange={(e) => {
            setCurrentTime(Number(e.target.value));
            setIsPlaying(false);
          }}
          className="w-full accent-violet-500 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />

        <div className="flex justify-between items-center px-2">
          <span className="text-xs font-mono text-gray-400">{formatTime(0)}</span>

          <div className="flex items-center gap-6">
            <button
              onClick={() => setCurrentTime(Math.max(0, currentTime - 5000))}
              className="text-gray-400 hover:text-violet-600 transition-colors text-lg"
              title="Back 5s"
            >
              ⏪
            </button>

            <button
              onClick={togglePlay}
              className="w-12 h-12 bg-violet-600 hover:bg-violet-500 text-white rounded-full flex items-center justify-center shadow-md transition-all active:scale-95"
              title={isPlaying ? "Pause" : "Play"}
            >
              <span className="text-xl">{isPlaying ? "⏸" : "▶"}</span>
            </button>

            <button
              onClick={() => setCurrentTime(Math.min(maxTime, currentTime + 5000))}
              className="text-gray-400 hover:text-violet-600 transition-colors text-lg"
              title="Forward 5s"
            >
              ⏩
            </button>
          </div>

          <span className="text-xs font-mono text-gray-400">{formatTime(maxTime)}</span>
        </div>
      </motion.div>
    </div>
  );
};

export default Replay;
