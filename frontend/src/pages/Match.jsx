import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";
import roomAPI from "../services/roomAPI";
import Editor from "@monaco-editor/react";
import { motion, AnimatePresence } from "framer-motion";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { MonacoBinding } from "y-monaco";
import toast from "react-hot-toast";

import { Play, CheckCircle2, XCircle, Trophy, Users, Clock, ExternalLink, Tag } from "lucide-react";

const RATING_COLORS = {
  easy: { bg: "bg-emerald-500/20", text: "text-emerald-400", border: "border-emerald-500/20", label: "Easy" },
  medium: { bg: "bg-amber-500/20", text: "text-amber-400", border: "border-amber-500/20", label: "Medium" },
  hard: { bg: "bg-red-500/20", text: "text-red-400", border: "border-red-500/20", label: "Hard" },
};

const getDifficultyFromRating = (rating) => {
  if (rating <= 1200) return "easy";
  if (rating <= 1800) return "medium";
  return "hard";
};

const getMatchDurationMs = (mode) => {
  const BLITZ_MODES = new Set(["BLITZ_1V1", "BLITZ_3V3"]);
  return BLITZ_MODES.has(mode) ? 15 * 60 * 1000 : 30 * 60 * 1000;
};

const getEntryUserId = (entry) => {
  if (!entry?.userId) return null;
  if (typeof entry.userId === "string") return entry.userId;
  return entry.userId._id || null;
};

const Match = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { socket, connected } = useSocket();
  const { user } = useAuth();
  
  const [matchData, setMatchData] = useState(null);
  const [cfProblem, setCfProblem] = useState(null);
  const [currentStage, setCurrentStage] = useState(0);
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [output, setOutput] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [matchFinished, setMatchFinished] = useState(null); // { winnerIds, finalScoreboard }
  const [scoreboard, setScoreboard] = useState([]); // live scoreboard data
  const [knockoutBracket, setKnockoutBracket] = useState(null); // knockout bracket data
  const [replayId, setReplayId] = useState(null); // populated when replay is ready

  const totalStages = Math.max(1, Number(matchData?.totalStages || 1));
  
  const editorRef = useRef(null);
  const ydocRef = useRef(null);
  const providerRef = useRef(null);
  const bindingRef = useRef(null);

  useEffect(() => {
    if (!socket || !connected) return;

    // --- Named handlers to avoid duplicate listeners on re-render ---
    const onMatchUpdate = (data) => {
      setMatchData(data);
      if (data.endTime) {
        setTimeLeft(Math.max(0, Math.floor((new Date(data.endTime) - new Date()) / 1000)));
      } else if (data.startTime && data.mode) {
        const computedEnd = new Date(new Date(data.startTime).getTime() + getMatchDurationMs(data.mode));
        setTimeLeft(Math.max(0, Math.floor((computedEnd - new Date()) / 1000)));
      }
      // Initialize scoreboard from player data
      if (data.players) {
        setScoreboard((prev) => (prev.length === 0 ? data.players : prev));
        const me = data.players.find((p) => getEntryUserId(p) === user?._id);
        if (me && Number.isFinite(me.currentStage)) {
          setCurrentStage(me.currentStage);
        }
      }
    };

    const onScoreboardUpdate = (data) => {
      setScoreboard(data);
      const me = data.find((p) => getEntryUserId(p) === user?._id);
      if (me && Number.isFinite(me.currentStage)) {
        setCurrentStage(me.currentStage);
      }
    };

    const onMatchFinished = (data) => {
      setMatchFinished(data);
      setTimeLeft(0);
      toast.success("Match has ended!");
    };

    const onPlayerEliminated = ({ userId: elimUserId, reason }) => {
      if (elimUserId === user?._id) {
        toast.error(`You were eliminated: ${reason}`);
      } else {
        toast("A player was eliminated", { icon: "💀" });
      }
    };

    const onSubmissionResult = (result) => {
      // submission:result is broadcast to the room; only show terminal output for self
      if (result.userId !== user?._id) {
        return;
      }
      setOutput(result);
      setIsSubmitting(false);
      if (result.passed) {
        toast.success("All test cases passed!");
      } else {
        toast.error("Some test cases failed.");
      }
    };

    // Knockout mode events
    const onKnockoutChampion = ({ winnerId }) => {
      if (winnerId === user?._id) {
        toast.success("🏆 You are the Knockout Champion!", { duration: 5000 });
      } else {
        toast("A Knockout Champion has been crowned!", { icon: "🏆", duration: 5000 });
      }
    };

    const onKnockoutNextRound = ({ round }) => {
      toast(`Round ${round} starting! Get ready...`, { icon: "⚔️", duration: 4000 });
    };

    const onKnockoutUpdated = ({ bracket }) => {
      setKnockoutBracket(bracket);
    };

    // Replay ready notification
    const onReplayReady = ({ replayId: rId }) => {
      setReplayId(rId);
      toast("Replay is ready to watch!", { icon: "🎬" });
      navigate(`/replay/${matchId}`);
    };

    const onMatchStateChanged = ({ status, startTime }) => {
      setMatchData((prev) => (prev ? { ...prev, status } : prev));

      if (status === "COUNTDOWN") {
        // Keep a visible pre-live countdown in match view.
        setTimeLeft(10);
      }

      if (status === "LIVE" && startTime) {
        const mode = matchData?.mode;
        if (!mode) return;
        const computedEnd = new Date(new Date(startTime).getTime() + getMatchDurationMs(mode));
        setTimeLeft(Math.max(0, Math.floor((computedEnd - new Date()) / 1000)));
      }
    };

    // Another player finished all stages
    const onPlayerFinished = ({ userId: finUserId }) => {
      if (finUserId !== user?._id) {
        toast("A player completed all stages!", { icon: "🏁" });
      }
    };

    // Remove any stale listeners BEFORE adding new ones (prevents duplicates)
    const allEvents = [
      "match:update", "scoreboard:update", "match:finished", "match:ended",
      "player:eliminated", "submission:result", "knockout:champion",
      "knockout:next-round", "knockout:updated", "replay:ready", "match:player-finished",
      "match:state-changed",
    ];
    allEvents.forEach((e) => socket.off(e));

    // (Re-)join match room — also handles reconnection after network blip
    socket.emit("match:join", { matchId });

    // Attach listeners
    socket.on("match:update", onMatchUpdate);
    socket.on("scoreboard:update", onScoreboardUpdate);
    socket.on("match:finished", onMatchFinished);
    socket.on("player:eliminated", onPlayerEliminated);
    socket.on("submission:result", onSubmissionResult);
    socket.on("knockout:champion", onKnockoutChampion);
    socket.on("knockout:next-round", onKnockoutNextRound);
    socket.on("knockout:updated", onKnockoutUpdated);
    socket.on("replay:ready", onReplayReady);
    socket.on("match:player-finished", onPlayerFinished);
    socket.on("match:state-changed", onMatchStateChanged);

    return () => {
      allEvents.forEach((e) => socket.off(e));
      socket.emit("match:leave", { matchId });
    };
  }, [socket, connected, matchId, user?._id, navigate, matchData?.mode]);

  // Fetch the deterministic stage problem for this match + stage
  useEffect(() => {
    const fetchProblem = async () => {
      try {
        const { data } = await roomAPI.get(`/problems/stage/${currentStage}`, {
          params: { matchId },
        });
        setCfProblem(data.data.problem);
        // Reset output panel when stage changes to avoid stale verdict confusion
        setOutput(null);
      } catch (e) {
        console.error("Failed to fetch problem:", e);
        setCfProblem({
          _id: null,
          title: "Loading Problem...",
          description: "Waiting for problem data...",
          difficultyRating: 800,
          tags: ["implementation"],
        });
      }
    };
    fetchProblem();
  }, [currentStage, matchId]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0) return;
    const interval = setInterval(() => {
      setTimeLeft(prev => prev > 0 ? prev - 1 : 0);
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLeft]);

  // Setup Yjs for Collaborative Editing (if in Team Mode)
  const handleEditorDidMount = (editor, monaco) => {
    editorRef.current = editor;

    // Define custom dark theme
    monaco.editor.defineTheme('arenaDark', {
      base: 'vs-dark',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#0f172a', // Tailwind slate-900
        'editor.lineHighlightBackground': '#1e293b',
      }
    });
    monaco.editor.setTheme('arenaDark');

    // Setup Collaboration
    if (matchData?.mode?.includes("TEAM")) {
      const ydoc = new Y.Doc();
      ydocRef.current = ydoc;

      // Connect to Y-Websocket server (You'll need a y-websocket server running, or piggyback on your socket.io if custom)
      // For now, we simulate connection to a public wss for demonstration, but you should route this to your backend
      const provider = new WebsocketProvider(
        import.meta.env.VITE_YJS_SERVER_URL || 'ws://localhost:1234',
        `match-${matchId}-team-${user?.teamId || 'A'}`,
        ydoc
      );
      providerRef.current = provider;

      const ytext = ydoc.getText("monaco");

      const binding = new MonacoBinding(
        ytext,
        editorRef.current.getModel(),
        new Set([editorRef.current]),
        provider.awareness
      );
      bindingRef.current = binding;

      // Set user awareness (Name & Cursor color)
      provider.awareness.setLocalStateField("user", {
        name: user?.name || "Anonymous",
        color: "#" + Math.floor(Math.random() * 16777215).toString(16),
      });
    }
  };

  const isSpectator = matchData?.players 
    ? !matchData.players.some(p => (p.userId?._id || p.userId) === user?._id)
    : false;

  const handleRunCode = () => {
    if (isSpectator) return;
    if (!cfProblem?._id) {
      toast.error("Problem not loaded yet");
      return;
    }
    setIsSubmitting(true);
    // Send code to backend for execution via Judge0
    socket.emit("submit:code", {
      matchId,
      problemId: cfProblem._id,
      sourceCode: editorRef.current.getValue(),
      language
    });
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col font-sans overflow-hidden">
      {/* Top Navbar */}
      <motion.header 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="h-16 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-6 shadow-md z-10 relative"
      >
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-violet-500" />
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-indigo-500">
              Battle Arena
            </h1>
          </div>
          <div className="h-6 w-px bg-slate-700 mx-2"></div>
          <span className="text-sm font-medium text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
            {matchData?.mode?.replace(/_/g, " ") || "Loading Match..."}
          </span>
          {isSpectator && (
            <span className="ml-2 text-xs font-bold bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/30">
              SPECTATING
            </span>
          )}
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 text-amber-400 bg-amber-400/10 px-4 py-1.5 rounded-full border border-amber-400/20">
            <Clock className="w-4 h-4 animate-pulse" />
            <span className="font-mono font-bold tracking-wider">{formatTime(timeLeft)}</span>
          </div>
          <button 
            onClick={() => navigate('/lobby')}
            className="text-sm text-slate-400 hover:text-white transition-colors"
          >
            Leave Match
          </button>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Left Panel: Problem & Leaderboard */}
        <motion.div 
          initial={{ x: -300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="w-1/3 flex flex-col border-r border-slate-800 bg-slate-900/50"
        >
          {/* Problem Description — from Codeforces API */}
          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
            {/* Stage indicator */}
            <div className="flex items-center gap-2 mb-4">
              {Array.from({ length: totalStages }).map((_, s) => (
                <div
                  key={s}
                  className={`w-8 h-1.5 rounded-full transition-all ${
                    s <= currentStage ? "bg-violet-500" : "bg-slate-700"
                  }`}
                />
              ))}
              <span className="text-[10px] font-bold text-slate-500 uppercase ml-2">Stage {Math.min(currentStage + 1, totalStages)}/{totalStages}</span>
            </div>

            <h2 className="text-2xl font-bold text-white mb-2">
              {cfProblem?.title || cfProblem?.name || "Loading..."}
            </h2>

            <div className="flex flex-wrap gap-2 mb-4">
              {(cfProblem?.difficultyRating || cfProblem?.rating) && (() => {
                const rating = cfProblem.difficultyRating || cfProblem.rating;
                const diff = getDifficultyFromRating(rating);
                const colors = RATING_COLORS[diff];
                return (
                  <span className={`text-xs font-bold px-2 py-1 rounded border ${colors.bg} ${colors.text} ${colors.border}`}>
                    {colors.label} ({rating})
                  </span>
                );
              })()}
              {cfProblem?.tags?.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-700/50 text-slate-400 border border-slate-600/50 flex items-center gap-1"
                >
                  <Tag className="w-2.5 h-2.5" />
                  {tag}
                </span>
              ))}
            </div>

            <div className="prose prose-invert prose-sm max-w-none text-slate-300 space-y-4">
              {/* Problem description */}
              <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
                <p className="text-sm text-slate-300 whitespace-pre-wrap">{cfProblem?.description || "Loading problem..."}</p>
              </div>

              {/* Constraints */}
              {cfProblem?.constraints && (
                <div className="bg-slate-800/30 p-3 rounded-lg border border-slate-700/50">
                  <p className="text-xs font-bold text-slate-500 uppercase mb-1">Constraints</p>
                  <p className="text-xs text-slate-400 font-mono">{cfProblem.constraints}</p>
                </div>
              )}

              {/* Examples */}
              {cfProblem?.examples?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-500 uppercase">Examples</p>
                  {cfProblem.examples.map((ex, i) => (
                    <div key={i} className="bg-slate-800/50 p-3 rounded border border-slate-700 font-mono text-xs">
                      <div className="mb-2"><span className="text-slate-500">Input: </span><span className="text-emerald-400">{ex.input}</span></div>
                      <div><span className="text-slate-500">Output: </span><span className="text-amber-400">{ex.output}</span></div>
                      {ex.explanation && <div className="mt-1 text-slate-500 font-sans">({ex.explanation})</div>}
                    </div>
                  ))}
                </div>
              )}

              {/* Visible test cases (from local Problem Bank) */}
              {cfProblem?.testCases?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-500 uppercase">Sample Test Cases</p>
                  {cfProblem.testCases.map((tc, i) => (
                    <div key={i} className="bg-slate-800/50 p-3 rounded border border-slate-700 font-mono text-xs">
                      <div className="mb-1"><span className="text-slate-500">Input: </span><pre className="inline text-emerald-400 whitespace-pre-wrap">{tc.input}</pre></div>
                      <div><span className="text-slate-500">Output: </span><pre className="inline text-amber-400 whitespace-pre-wrap">{tc.expectedOutput}</pre></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Live Leaderboard Sidebar */}
          <div className="h-1/3 border-t border-slate-800 bg-slate-900 flex flex-col">
            <div className="p-3 border-b border-slate-800 flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-400" />
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Live Standings</h3>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {(scoreboard.length > 0 ? scoreboard : matchData?.players || []).map((p, idx) => {
                const playerName = p.name || p.userId?.name || `Player ${idx+1}`;
                const playerStatus = p.status || (p.isAlive === false ? "ELIMINATED" : "PLAYING");
                const playerScore = p.score ?? 0;
                return (
                  <div key={p.userId?._id || p.userId} className="flex items-center justify-between p-2 rounded hover:bg-slate-800 transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono text-slate-500 w-4">{p.rank || idx + 1}</span>
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white shadow-lg">
                        {playerName[0] || "P"}
                      </div>
                      <span className="text-sm font-medium text-slate-300">{playerName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono text-slate-500">{playerScore} pts</span>
                      {playerStatus === "FINISHED" ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : playerStatus === "ELIMINATED" || p.isAlive === false ? (
                        <XCircle className="w-4 h-4 text-red-500" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border-2 border-slate-600 border-t-violet-500 animate-spin" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </motion.div>

        {/* Right Panel: Editor & Console */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="w-2/3 flex flex-col relative"
        >
          {/* Editor Header */}
          <div className="h-12 bg-slate-900 border-b border-slate-800 flex items-center justify-between px-4">
            <select 
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              disabled={isSpectator}
              className="bg-slate-800 border border-slate-700 text-sm rounded px-3 py-1 text-slate-300 focus:outline-none focus:border-violet-500 transition-colors disabled:opacity-50"
            >
              <option value="javascript">JavaScript (Node.js)</option>
              <option value="python">Python 3</option>
              <option value="cpp">C++ (GCC)</option>
              <option value="java">Java (OpenJDK)</option>
            </select>

            {!isSpectator && (
              <button
                onClick={handleRunCode}
                disabled={isSubmitting}
                className="flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white px-5 py-1.5 rounded text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Play className="w-4 h-4 fill-current" />
                )}
                {isSubmitting ? "Running..." : "Run Code"}
              </button>
            )}
          </div>

          {/* Monaco Editor */}
          <div className="flex-1 relative">
            {/* Glowing accent border */}
            <div className="absolute inset-0 pointer-events-none border border-violet-500/10 shadow-[inset_0_0_50px_rgba(139,92,246,0.05)] z-10" />
            <Editor
              height="100%"
              language={language}
              theme="vs-dark" // Fallback, will be overridden by onMount
              value={code}
              onChange={(val) => setCode(val)}
              onMount={handleEditorDidMount}
              options={{
                readOnly: isSpectator,
                minimap: { enabled: false },
                fontSize: 14,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                lineHeight: 24,
                padding: { top: 16 },
                scrollBeyondLastLine: false,
                smoothScrolling: true,
                cursorBlinking: "smooth",
                cursorSmoothCaretAnimation: "on",
                formatOnPaste: true,
              }}
              loading={<div className="h-full flex items-center justify-center text-slate-500">Loading Editor Engine...</div>}
            />
          </div>

          {/* Console / Output Terminal */}
          <AnimatePresence>
            {output && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "30%", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="border-t border-slate-800 bg-[#0a0f18] flex flex-col"
              >
                <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800 bg-slate-900/50">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Execution Result</span>
                  <button onClick={() => setOutput(null)} className="text-slate-500 hover:text-slate-300">
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex-1 p-4 overflow-y-auto font-mono text-sm">
                  {output.passed ? (
                    <div className="text-emerald-400 mb-2 font-bold flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5" /> Accepted! All test cases passed.
                    </div>
                  ) : (
                    <div className="text-red-400 mb-2 font-bold flex items-center gap-2">
                      <XCircle className="w-5 h-5" /> Wrong Answer
                    </div>
                  )}
                  
                  <div className="mt-4 space-y-3">
                    <div>
                      <span className="text-slate-500 text-xs uppercase">Runtime</span>
                      <p className="text-slate-300">{output.runtime} ms</p>
                    </div>
                    {output.error && (
                      <div>
                        <span className="text-red-500/70 text-xs uppercase">Error Log</span>
                        <pre className="text-red-400 bg-red-500/10 p-3 rounded mt-1 overflow-x-auto">
                          {output.error}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Match Finished Overlay */}
      <AnimatePresence>
        {matchFinished && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, type: "spring", damping: 20 }}
              className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-lg w-full mx-4 shadow-2xl"
            >
              <div className="text-center mb-6">
                <Trophy className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
                <h2 className="text-2xl font-black text-white">Match Complete</h2>
                <p className="text-slate-400 text-sm mt-1">
                  {matchData?.mode?.replace(/_/g, " ") || "Match"} has ended
                </p>
              </div>

              {/* Winner */}
              {matchFinished.winnerIds?.length > 0 && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-6 text-center">
                  <p className="text-xs font-bold text-yellow-500 uppercase tracking-wider mb-1">Winner</p>
                  <p className="text-lg font-bold text-yellow-400">
                    {matchFinished.winnerIds.includes(user?._id)
                      ? "🎉 You Won!"
                      : matchFinished.finalScoreboard?.find(p => 
                          matchFinished.winnerIds.includes(p.userId?._id || p.userId)
                        )?.userId?.name || "Opponent"
                    }
                  </p>
                </div>
              )}

              {/* Final Scoreboard */}
              <div className="space-y-2 mb-6 max-h-48 overflow-y-auto">
                {(matchFinished.finalScoreboard || []).map((p, idx) => {
                  const isWinner = matchFinished.winnerIds?.some(
                    wid => (wid?.toString?.() || wid) === (p.userId?._id?.toString?.() || p.userId?.toString?.())
                  );
                  const isMe = (p.userId?._id || p.userId)?.toString?.() === user?._id;
                  return (
                    <div
                      key={p.userId?._id || p.userId || idx}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        isMe ? "bg-violet-500/10 border border-violet-500/20" : "bg-slate-800/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-slate-500 w-4">{idx + 1}</span>
                        <span className="text-sm font-medium text-slate-300">
                          {p.userId?.name || `Player ${idx + 1}`}
                          {isMe && <span className="text-violet-400 ml-1">(You)</span>}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-mono text-slate-400">{p.score || 0} pts</span>
                        {isWinner && <Trophy className="w-4 h-4 text-yellow-400" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => navigate("/dashboard")}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold rounded-lg transition-colors"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => navigate(`/replay/${matchId}`)}
                  className="flex-1 py-3 bg-violet-600 hover:bg-violet-500 text-white text-sm font-bold rounded-lg transition-colors"
                >
                  Watch Replay
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #334155; border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #475569; }
      `}</style>
    </div>
  );
};

export default Match;
