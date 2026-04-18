/**
 * Spectate — Browse live matches and watch players code in real-time.
 *
 * Two views:
 *  1. Match Browser (no matchId param)  — GET /api/spectator/live
 *  2. Spectator Arena  (with matchId)   — socket events for live code relay
 */
import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";
import roomAPI from "../services/roomAPI";
import Editor from "@monaco-editor/react";
import gsap from "gsap";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (s) => {
  if (s <= 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec < 10 ? "0" : ""}${sec}`;
};

const MODE_LABELS = {
  BLITZ_1V1: "Blitz 1v1",
  TEAM_DUEL_2V2: "Team 2v2",
  TEAM_DUEL_3V3: "Team 3v3",
  BLITZ_3V3: "Blitz 3v3",
  BATTLE_ROYALE: "Battle Royale",
  KNOCKOUT: "Knockout",
  ICPC_STYLE: "ICPC Style",
};

// ─── Match Browser ──────────────────────────────────────────────────────────

const MatchBrowser = () => {
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef(null);

  const fetchLive = useCallback(() => {
    roomAPI
      .get("/spectator/live")
      .then(({ data }) => setMatches(data.data || []))
      .catch(() => setMatches([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchLive();
    const iv = setInterval(fetchLive, 8000);
    return () => clearInterval(iv);
  }, [fetchLive]);

  useEffect(() => {
    if (loading || !containerRef.current) return;
    const ctx = gsap.context(() => {
      gsap.from(".spec-anim", {
        y: 40,
        opacity: 0,
        duration: 0.8,
        stagger: 0.12,
        ease: "power3.out",
      });
    }, containerRef);
    return () => ctx.revert();
  }, [loading]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#13121B] flex items-center justify-center">
        <span className="w-6 h-6 border-2 border-[#B7FF2A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen bg-[#13121B] text-white font-['Rajdhani'] relative overflow-hidden"
      ref={containerRef}
    >
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_18%_20%,rgba(183,255,42,0.1),transparent_35%),radial-gradient(circle_at_85%_78%,rgba(0,225,255,0.08),transparent_32%)]" />
      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14 space-y-10">
        {/* Header */}
        <section className="spec-anim border-b border-[#2f2b45] pb-8">
          <p className="text-[10px] font-semibold text-[#8f8ca3] uppercase tracking-[0.24em] mb-4">
            spectator mode
          </p>
          <h1 className="text-4xl sm:text-5xl font-[Oxanium] font-black tracking-tight uppercase leading-[0.92]">
            Watch Live
          </h1>
          <p className="text-sm text-[#8e8aa1] mt-3 max-w-[60ch]">
            Browse live matches and spectate players coding in real-time.
          </p>
        </section>

        {matches.length === 0 ? (
          <section className="spec-anim text-center py-20 border-2 border-dashed border-[#302E46] rounded-3xl">
            <p className="text-4xl mb-4">📡</p>
            <p className="text-lg font-bold text-white mb-2">No Live Matches</p>
            <p className="text-sm text-[#8e8aa1] mb-6">
              There are no active matches right now. Check back later!
            </p>
            <Link
              to="/dashboard"
              className="inline-block px-5 py-2.5 rounded-full text-xs uppercase tracking-[0.16em] font-bold bg-[#1b1a29] hover:bg-[#232137] transition-colors text-[#d7d5e3]"
            >
              back to dashboard
            </Link>
          </section>
        ) : (
          <section className="spec-anim">
            <p className="text-[10px] font-semibold text-[#8f8ca3] uppercase tracking-[0.24em] mb-4">
              {matches.length} live {matches.length === 1 ? "match" : "matches"}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {matches.map((m) => {
                const timeLeft = m.endTime
                  ? Math.max(0, Math.floor((new Date(m.endTime) - Date.now()) / 1000))
                  : 0;
                return (
                  <button
                    key={m.matchId}
                    onClick={() => navigate(`/spectate/${m.matchId}`)}
                    className="group relative overflow-hidden rounded-3xl p-[1px] bg-gradient-to-br from-[#4f4a67] to-[#222033] hover:from-[#b7ff2a]/80 hover:to-[#3b3652] transition-all duration-300 text-left"
                  >
                    <div className="rounded-[calc(1.5rem-1px)] bg-[#181827]/95 p-6">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                          <span className="text-[10px] font-bold text-red-400 uppercase tracking-[0.18em]">
                            LIVE
                          </span>
                        </div>
                        <span className="text-[10px] font-semibold text-[#8f8ca3] uppercase tracking-[0.18em]">
                          {fmt(timeLeft)} left
                        </span>
                      </div>

                      <p className="text-xl font-[Oxanium] font-black">
                        {MODE_LABELS[m.gameMode] || m.gameMode}
                      </p>

                      <div className="flex items-center gap-2 mt-3 flex-wrap">
                        {m.players?.map((p, i) => (
                          <span
                            key={i}
                            className="text-xs bg-[#1C1A2A] text-[#A9A8B8] px-2.5 py-1 rounded-full font-semibold"
                          >
                            {p.name || `Player ${i + 1}`}
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-[#2f2b45]">
                        <span className="text-[10px] text-[#8f8ca3] uppercase tracking-[0.16em] font-semibold">
                          {m.spectatorCount || 0} watching
                        </span>
                        <span className="text-xs font-bold text-[#B7FF2A] uppercase tracking-[0.16em] opacity-0 group-hover:opacity-100 transition-opacity">
                          Spectate →
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

// ─── Spectator Arena ────────────────────────────────────────────────────────

const SpectatorArena = ({ matchId }) => {
  const navigate = useNavigate();
  const { socket, connected } = useSocket();
  const { user } = useAuth();

  const [matchData, setMatchData] = useState(null);
  const [players, setPlayers] = useState([]);
  const [watchingId, setWatchingId] = useState(null);
  const [code, setCode] = useState("// Select a player to watch their live code");
  const [language, setLanguage] = useState("javascript");
  const [problem, setProblem] = useState(null);
  const [playerState, setPlayerState] = useState(null);
  const [scoreboard, setScoreboard] = useState([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [matchEnded, setMatchEnded] = useState(false);
  const [loading, setLoading] = useState(true);

  const timerRef = useRef(null);

  // Fetch match info + join as spectator
  useEffect(() => {
    roomAPI
      .get(`/spectator/${matchId}`)
      .then(({ data }) => {
        const d = data.data;
        setMatchData(d);
        setPlayers(d.players || []);
        setScoreboard(d.scoreboard || d.players || []);
        if (d.endTime) {
          setTimeLeft(Math.max(0, Math.floor((new Date(d.endTime) - Date.now()) / 1000)));
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [matchId]);

  // Socket events
  useEffect(() => {
    if (!socket || !connected) return;

    // Join match room so we get match-level events
    socket.emit("match:join", { matchId });

    const onCodeUpdate = ({ userId, sourceCode, language: lang, timestamp }) => {
      setCode(sourceCode);
      if (lang) setLanguage(lang);
    };

    const onPlayerState = ({ userId, currentStage, score, wrongAttempts }) => {
      setPlayerState({ currentStage, score, wrongAttempts });
      // Fetch the problem for the stage the watched player is on
      if (currentStage !== undefined) {
        roomAPI
          .get(`/problems/stage/${currentStage}`, { params: { matchId } })
          .then(({ data }) => setProblem(data.data.problem))
          .catch(() => {});
      }
    };

    const onSubmissionResult = (res) => {
      setSubmissionResult(res);
      setTimeout(() => setSubmissionResult(null), 6000);
    };

    const onScoreboardUpdate = (data) => {
      setScoreboard(data);
    };

    const onMatchFinished = () => {
      setMatchEnded(true);
      setTimeLeft(0);
    };

    const onWatching = ({ success, targetUserId }) => {
      if (success) setWatchingId(targetUserId);
    };

    const onSpectateError = ({ message }) => {
      console.warn("[Spectate Error]", message);
    };

    const onPlayerAdvanced = ({ userId, questionIndex, score }) => {
      setScoreboard((prev) =>
        prev.map((p) =>
          (p.userId?._id || p.userId || p._id) === userId
            ? { ...p, currentStage: questionIndex, score }
            : p
        )
      );
      // If the watched player advanced, reload their problem
      if (userId === watchingId && questionIndex !== undefined) {
        roomAPI
          .get(`/problems/stage/${questionIndex}`, { params: { matchId } })
          .then(({ data }) => setProblem(data.data.problem))
          .catch(() => {});
        setPlayerState((prev) => ({ ...prev, currentStage: questionIndex, score }));
      }
    };

    socket.on("spectate:code-update", onCodeUpdate);
    socket.on("spectate:player-state", onPlayerState);
    socket.on("spectate:submission-result", onSubmissionResult);
    socket.on("spectate:watching", onWatching);
    socket.on("spectate:error", onSpectateError);
    socket.on("scoreboard:update", onScoreboardUpdate);
    socket.on("match:finished", onMatchFinished);
    socket.on("match:player-advanced", onPlayerAdvanced);

    return () => {
      socket.off("spectate:code-update", onCodeUpdate);
      socket.off("spectate:player-state", onPlayerState);
      socket.off("spectate:submission-result", onSubmissionResult);
      socket.off("spectate:watching", onWatching);
      socket.off("spectate:error", onSpectateError);
      socket.off("scoreboard:update", onScoreboardUpdate);
      socket.off("match:finished", onMatchFinished);
      socket.off("match:player-advanced", onPlayerAdvanced);
      socket.emit("spectate:stop-watching");
      socket.emit("match:leave", { matchId });
    };
  }, [socket, connected, matchId, watchingId]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [timeLeft]);

  // Watch a player
  const watchPlayer = (playerId) => {
    if (!socket) return;
    socket.emit("spectate:stop-watching");
    setCode("// Loading player code...");
    setPlayerState(null);
    setProblem(null);
    setSubmissionResult(null);
    socket.emit("spectate:watch-player", { matchId, targetUserId: playerId });
  };

  // Auto-watch the first player once loaded
  useEffect(() => {
    if (players.length > 0 && !watchingId && socket && connected) {
      const firstId = players[0]?._id || players[0]?.userId?._id || players[0]?.userId;
      if (firstId) watchPlayer(firstId);
    }
  }, [players, socket, connected]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#13121B] flex items-center justify-center">
        <span className="w-6 h-6 border-2 border-[#B7FF2A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (matchEnded) {
    return (
      <div className="min-h-screen bg-[#13121B] font-['Rajdhani'] flex items-center justify-center px-4">
        <div className="w-full max-w-lg text-center">
          <p className="text-5xl mb-4">🏁</p>
          <h1 className="text-3xl font-[Oxanium] font-black text-white tracking-tight mb-2">
            Match Ended
          </h1>
          <p className="text-sm text-[#8e8aa1] mb-8">
            {MODE_LABELS[matchData?.gameMode] || "Match"} has finished.
          </p>

          {scoreboard.length > 0 && (
            <div className="rounded-3xl p-[1px] bg-gradient-to-br from-[#3f3a56] to-[#262337] mb-8">
              <div className="rounded-[calc(1.5rem-1px)] bg-[#171624]/95 divide-y divide-[#2f2b45] overflow-hidden">
                {scoreboard.map((p, i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{i === 0 ? "🥇" : i === 1 ? "🥈" : "🥉"}</span>
                      <p className="text-sm font-bold text-white">
                        {p.userId?.name || p.name || `Player ${i + 1}`}
                      </p>
                    </div>
                    <p className="text-sm font-black text-[#B7FF2A]">{p.score || 0} pts</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-center">
            <button
              onClick={() => navigate("/spectate")}
              className="px-5 py-3 rounded-full text-xs uppercase tracking-[0.16em] font-bold bg-[#1b1a29] hover:bg-[#232137] transition-colors text-[#d7d5e3]"
            >
              Browse More
            </button>
            <button
              onClick={() => navigate(`/replay/${matchId}`)}
              className="px-5 py-3 bg-[#B7FF2A] text-[#13121B] text-xs font-bold rounded-full uppercase tracking-[0.16em] hover:brightness-110 transition-all"
            >
              View Replay
            </button>
          </div>
        </div>
      </div>
    );
  }

  const watchedPlayer = players.find(
    (p) => (p._id || p.userId?._id || p.userId) === watchingId
  );

  return (
    <div
      className="h-screen bg-[#13121B] font-['Rajdhani'] flex flex-col overflow-hidden text-white"
      style={{ fontFamily: "'Rajdhani', 'Segoe UI', sans-serif" }}
    >
      {/* ── Top bar ── */}
      <div className="h-14 border-b border-[#302E46] flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-[Oxanium] font-bold text-white">KRYPTCODE</span>
          <span className="font-[Oxanium] font-bold text-[#B7FF2A]">SPECTATOR</span>
          <span className="text-gray-200 mx-1">|</span>
          <span className="text-xs font-semibold text-[#A9A8B8]">
            {MODE_LABELS[matchData?.gameMode] || "Match"}
          </span>
          <div className="flex items-center gap-1.5 ml-2">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-[10px] font-bold text-red-400 uppercase tracking-[0.14em]">
              LIVE
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Timer */}
          <div className="flex flex-col items-center gap-0.5">
            <span className="text-[10px] uppercase font-bold text-[#A9A8B8]">Ends in</span>
            <div
              className={`font-mono font-bold text-lg px-4 py-1 rounded-xl ${
                timeLeft < 60
                  ? "bg-red-500/10 text-red-400 animate-pulse"
                  : "bg-[#1C1A2A] text-white"
              }`}
            >
              {fmt(timeLeft)}
            </div>
          </div>

          {/* Scoreboard pills */}
          {scoreboard.map((p, i) => {
            const pid = p.userId?._id || p.userId || p._id;
            const isWatched = pid === watchingId;
            return (
              <button
                key={i}
                onClick={() => watchPlayer(pid)}
                className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-xl transition-all ${
                  isWatched
                    ? "bg-[rgba(183,255,42,0.12)] text-[#B7FF2A] ring-1 ring-[#B7FF2A]/30"
                    : "bg-[#1C1A2A] text-[#A9A8B8] hover:bg-[#232137]"
                }`}
              >
                <div className="w-5 h-5 rounded-full bg-[#302E46] flex items-center justify-center text-[10px] font-bold">
                  {(p.userId?.name || p.name || "?")[0]?.toUpperCase()}
                </div>
                <span className="font-semibold">{p.userId?.name || p.name || `P${i + 1}`}</span>
                <span className="font-black">{p.score || 0}</span>
              </button>
            );
          })}

          <Link
            to="/spectate"
            className="text-xs text-[#A9A8B8] hover:text-red-400 transition-colors"
          >
            Leave
          </Link>
        </div>
      </div>

      {/* ── Main split ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left: Problem panel */}
        <div className="w-[42%] border-r border-[#302E46] overflow-y-auto p-6 space-y-5">
          {/* Watching label */}
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-[#B7FF2A]" />
            <span className="text-[10px] font-bold text-[#B7FF2A] uppercase tracking-[0.18em]">
              Watching: {watchedPlayer?.name || watchedPlayer?.userId?.name || "—"}
            </span>
            {playerState && (
              <span className="text-[10px] text-[#8f8ca3] uppercase tracking-[0.14em] ml-auto">
                Q{(playerState.currentStage || 0) + 1} · {playerState.score || 0}pts ·{" "}
                {playerState.wrongAttempts || 0} wrong
              </span>
            )}
          </div>

          {problem ? (
            <>
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-[#1C1A2A] text-[#A9A8B8]">
                    {problem.difficulty} · {problem.difficultyRating}
                  </span>
                  {problem.tags?.slice(0, 3).map((t) => (
                    <span
                      key={t}
                      className="text-xs text-[#A9A8B8] bg-[#1C1A2A] px-2 py-0.5 rounded-full"
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <h2 className="text-xl font-bold text-white">{problem.title}</h2>
              </div>

              <div className="text-sm text-[#A9A8B8] leading-relaxed whitespace-pre-wrap">
                {problem.description}
              </div>

              {problem.constraints && (
                <div className="bg-[#1C1A2A] rounded-lg p-4 border border-[#302E46]">
                  <p className="text-xs font-semibold text-[#A9A8B8] uppercase tracking-wide mb-1">
                    Constraints
                  </p>
                  <p className="text-xs font-mono text-[#A9A8B8] whitespace-pre-wrap">
                    {problem.constraints}
                  </p>
                </div>
              )}

              {problem.examples?.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-[#A9A8B8] uppercase tracking-wide">
                    Examples
                  </p>
                  {problem.examples.map((ex, i) => (
                    <div
                      key={i}
                      className="bg-[#1C1A2A] rounded-lg p-4 border border-[#302E46] font-mono text-xs space-y-1"
                    >
                      <div>
                        <span className="text-[#A9A8B8]">Input: </span>
                        <span className="text-white">{ex.input}</span>
                      </div>
                      <div>
                        <span className="text-[#A9A8B8]">Output: </span>
                        <span className="text-[#B7FF2A] font-bold">{ex.output}</span>
                      </div>
                      {ex.explanation && (
                        <div className="text-[#A9A8B8] font-sans">{ex.explanation}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="text-3xl mb-3">👁️</p>
              <p className="text-sm text-[#8f8ca3]">
                Select a player above to see their current problem
              </p>
            </div>
          )}
        </div>

        {/* Right: Read-only code editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Editor toolbar */}
          <div className="h-12 border-b border-[#302E46] flex items-center justify-between px-4 shrink-0">
            <div className="flex items-center gap-3">
              <span className="text-xs font-semibold bg-[#1C1A2A] rounded-lg px-3 py-1.5 text-[#A9A8B8]">
                {language}
              </span>
              <span className="text-[10px] text-[#8f8ca3] uppercase tracking-[0.14em] font-semibold">
                read-only · spectator view
              </span>
            </div>

            {submissionResult && (
              <div
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold animate-pulse ${
                  submissionResult.passed
                    ? "bg-[rgba(183,255,42,0.12)] text-[#B7FF2A]"
                    : "bg-[rgba(239,68,68,0.12)] text-red-400"
                }`}
              >
                <span>{submissionResult.passed ? "✅" : "❌"}</span>
                <span>{submissionResult.passed ? "Accepted" : "Wrong Answer"}</span>
              </div>
            )}
          </div>

          {/* Monaco Editor (read-only) */}
          <div className="flex-1 overflow-hidden">
            <Editor
              height="100%"
              language={language === "cpp" ? "cpp" : language}
              value={code}
              theme="vs-dark"
              options={{
                readOnly: true,
                minimap: { enabled: false },
                fontSize: 13,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                lineHeight: 22,
                padding: { top: 12 },
                scrollBeyondLastLine: false,
                wordWrap: "on",
                renderLineHighlight: "none",
                domReadOnly: true,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

// ─── Main Export ─────────────────────────────────────────────────────────────

const Spectate = () => {
  const { matchId } = useParams();

  if (matchId) {
    return <SpectatorArena matchId={matchId} />;
  }
  return <MatchBrowser />;
};

export default Spectate;
