/**
 * Replay — shows what each player submitted for each question.
 * No timestamps, no playback. Just code viewer.
 */
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import roomAPI from "../services/roomAPI";
import Editor from "@monaco-editor/react";

const Replay = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const [replay, setReplay] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null); // { playerName, questionIndex, language, sourceCode, verdict, history: [] }
  const [playing, setPlaying] = useState(null); // { index: 0, interval: null }

  useEffect(() => {
    roomAPI.get(`/replay/${matchId}`)
      .then(({ data }) => {
        setReplay(data.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.response?.data?.message || "Replay not available yet");
        setLoading(false);
      });
  }, [matchId]);

  // Clean up playback on unmount or selection change
  useEffect(() => {
    return () => {
      if (playing?.interval) clearInterval(playing.interval);
    };
  }, [playing]);

  const startPlayback = (sub) => {
    if (playing?.interval) clearInterval(playing.interval);
    
    // Create a series of snapshots: start with empty or template, then all history, finally the submission
    const history = sub.history || [];
    if (history.length === 0) return;

    let idx = 0;
    const interval = setInterval(() => {
      setPlaying(prev => {
        if (!prev) return null;
        const nextIdx = prev.index + 1;
        if (nextIdx >= history.length) {
          clearInterval(interval);
          return { ...prev, index: nextIdx - 1, isFinished: true };
        }
        return { ...prev, index: nextIdx };
      });
    }, 500); // 500ms between snapshots for "video" feel

    setPlaying({ index: 0, interval, isFinished: false });
  };

  const stopPlayback = () => {
    if (playing?.interval) clearInterval(playing.interval);
    setPlaying(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <span className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !replay) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center">
          <p className="text-2xl mb-3">🎬</p>
          <h2 className="text-xl font-bold text-[#111827] mb-2">Replay Not Available</h2>
          <p className="text-sm text-gray-400 mb-6">{error || "This replay hasn't been finalized yet."}</p>
          <button
            onClick={() => navigate("/dashboard")}
            className="px-5 py-2.5 bg-[#111827] text-white text-sm font-semibold rounded-lg"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // 1. Group events by user
  const events = replay.events || [];
  const playerGroups = {};

  events.forEach((ev) => {
    const uid = ev.userId?._id || ev.userId;
    const name = ev.userId?.name || "Unknown Player";
    if (!playerGroups[uid]) {
      playerGroups[uid] = { name, submissions: [], updates: [] };
    }
    
    if (ev.type === "submission" || ev.type === "SUBMISSION") {
      playerGroups[uid].submissions.push(ev);
    } else if (ev.type === "code_update") {
      playerGroups[uid].updates.push(ev);
    }
  });

  // 2. Build display list per player
  const playersData = Object.entries(playerGroups).map(([uid, group]) => {
    // For each submission, find the code updates that happened BEFORE it but AFTER the previous submission
    const subs = group.submissions.map((s, i) => {
      const prevTime = i === 0 ? 0 : group.submissions[i-1].offsetMs;
      const history = group.updates
        .filter(u => u.offsetMs > prevTime && u.offsetMs <= s.offsetMs)
        .map(u => ({ sourceCode: u.data.sourceCode, offsetMs: u.offsetMs }));
      
      // Add the final submission code as the last frame
      history.push({ sourceCode: s.data.sourceCode, offsetMs: s.offsetMs });

      return {
        playerName: group.name,
        questionIndex: s.data.questionIndex ?? 0,
        language: s.data.language || "javascript",
        sourceCode: s.data.sourceCode || "// No code",
        verdict: s.data.verdict || "Unknown",
        problemTitle: s.data.problemTitle || `Question ${(s.data.questionIndex ?? 0) + 1}`,
        history,
      };
    });

    return { name: group.name, subs };
  });

  const verdictStyle = (v) => {
    if (v === "Accepted") return "bg-emerald-50 text-emerald-600 border-emerald-100";
    return "bg-red-50 text-red-500 border-red-100";
  };

  return (
    <div className="min-h-screen bg-white text-[#111827]">
      {/* Nav */}
      <nav className="border-b border-gray-100 px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="font-bold">Battle</span>
          <span className="font-bold text-violet-600">Arena</span>
          <span className="mx-2 text-gray-200">|</span>
          <span className="text-sm text-gray-500">Match Replay</span>
        </div>
        <button onClick={() => navigate("/dashboard")} className="text-xs text-gray-400 hover:text-[#111827] transition-colors">
          ← Dashboard
        </button>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Match Replay</h1>
          <p className="text-gray-400 text-sm mt-1">Review what each player submitted</p>
        </div>

        {/* Final scoreboard */}
        {replay.finalScoreboard?.length > 0 && (
          <div className="mb-8 border border-gray-100 rounded-xl overflow-hidden shadow-sm">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Final Result</p>
            </div>
            {replay.finalScoreboard.map((p, i) => (
              <div key={i} className={`flex items-center justify-between px-5 py-4 ${i > 0 ? "border-t border-gray-100" : ""}`}>
                <div className="flex items-center gap-3">
                  <span className="text-lg">{i === 0 ? "🥇" : "🥈"}</span>
                  <p className="text-sm font-bold">{p.userId?.name || `Player ${i + 1}`}</p>
                </div>
                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span>Q{(p.currentStage || 0) + 1} reached</span>
                  <span>{p.wrongAttempts || 0} wrong</span>
                  <span className="font-black text-violet-600 text-sm">{p.score || 0} pts</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {playersData.length === 0 ? (
          <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl">
            <p className="text-gray-400 text-sm">No submissions were recorded for this match.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {playersData.map((player) => (
              <div key={player.name} className="border border-gray-100 rounded-xl overflow-hidden shadow-sm">
                <div className="px-5 py-4 bg-gray-50 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-violet-100 flex items-center justify-center text-xs font-bold text-violet-700">
                      {player.name[0]?.toUpperCase()}
                    </div>
                    <p className="text-sm font-bold text-[#111827]">{player.name}</p>
                  </div>
                </div>

                <div className="divide-y divide-gray-100">
                  {player.subs.map((sub, i) => (
                    <div key={i} className="flex flex-col group hover:bg-gray-50 transition-colors">
                      <div className="w-full flex items-center justify-between px-5 py-3.5 text-left">
                        <div>
                          <p className="text-sm font-semibold text-[#111827]">{sub.problemTitle}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{sub.language} · {sub.history.length} snapshots</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${verdictStyle(sub.verdict)}`}>
                            {sub.verdict === "Accepted" ? "AC" : "WA"}
                          </span>
                          <button
                            onClick={() => setSelected(sub)}
                            className="bg-[#111827] text-white text-[10px] font-bold px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-all opacity-0 group-hover:opacity-100"
                          >
                            View
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Code viewer modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden border border-gray-100">
            {/* Modal header */}
            <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 bg-gray-50/50">
              <div>
                <p className="font-bold text-lg text-[#111827]">{selected.problemTitle}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-gray-500">{selected.playerName} · {selected.language}</span>
                  <span className="text-gray-300">·</span>
                  <span className={`text-xs font-bold ${selected.verdict === "Accepted" ? "text-emerald-600" : "text-red-500"}`}>
                    {selected.verdict}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {selected.history?.length > 0 && !playing && (
                   <button 
                    onClick={() => startPlayback(selected)}
                    className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-emerald-700 transition-all"
                   >
                     ▶ Play Replay
                   </button>
                )}
                {playing && (
                   <button 
                    onClick={stopPlayback}
                    className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-600 transition-all"
                   >
                     ■ Stop
                   </button>
                )}
                <button
                  onClick={() => { setSelected(null); stopPlayback(); }}
                  className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all text-xl"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Playback progress bar */}
            {playing && (
              <div className="h-1 bg-gray-100 w-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${((playing.index + 1) / selected.history.length) * 100}%` }}
                />
              </div>
            )}

            {/* Monaco Editor */}
            <div className="relative">
              <Editor
                height="450px"
                language={selected.language === "cpp" ? "cpp" : selected.language}
                value={playing ? selected.history[playing.index]?.sourceCode : selected.sourceCode}
                theme="light"
                options={{
                  readOnly: true,
                  minimap: { enabled: false },
                  fontSize: 13,
                  fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                  lineHeight: 22,
                  padding: { top: 20 },
                  scrollBeyondLastLine: false,
                  renderLineHighlight: "none",
                }}
              />
              {playing && (
                <div className="absolute top-4 right-8 bg-black/80 text-white px-3 py-1.5 rounded-full text-[10px] font-bold font-mono backdrop-blur-md">
                  T +{Math.round(selected.history[playing.index].offsetMs / 1000)}s
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Replay;
