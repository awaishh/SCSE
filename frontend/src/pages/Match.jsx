import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";
import roomAPI from "../services/roomAPI";
import Editor from "@monaco-editor/react";
import toast from "react-hot-toast";

// ─── Helpers ────────────────────────────────────────────────────────────────

const fmt = (s) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec < 10 ? "0" : ""}${sec}`;
};

const diffColor = (rating) => {
  if (!rating) return { bg: "bg-[#1C1A2A]", text: "text-[#A9A8B8]" };
  if (rating <= 1099) return { bg: "bg-[rgba(183,255,42,0.1)]", text: "text-[#B7FF2A]" };
  if (rating <= 1499) return { bg: "bg-amber-50", text: "text-amber-600" };
  return { bg: "bg-red-50", text: "text-red-600" };
};

const STARTER = {
  javascript: `// Read from stdin
const lines = require('fs').readFileSync('/dev/stdin','utf8').trim().split('\\n');
// Write your solution here
`,
  python: `import sys
data = sys.stdin.read().split()
# Write your solution here
`,
  cpp: `#include<bits/stdc++.h>
using namespace std;
int main(){
    // Write your solution here
    return 0;
}`,
  java: `import java.util.*;
public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // Write your solution here
    }
}`,
};

// ─── Component ──────────────────────────────────────────────────────────────

const Match = () => {
  const { matchId } = useParams();
  const navigate = useNavigate();
  const { socket, connected } = useSocket();
  const { user } = useAuth();

  const [matchData, setMatchData] = useState(null);
  const [problem, setProblem] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState(STARTER.javascript);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null); // last submission result
  const [scoreboard, setScoreboard] = useState([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [finished, setFinished] = useState(null); // { winnerIds, finalScoreboard }

  const editorRef = useRef(null);
  const timerRef = useRef(null);

  // ── Fetch problem for current question index ──
  const fetchProblem = async (idx) => {
    try {
      const { data } = await roomAPI.get(`/problems/stage/${idx}`, {
        params: { matchId },
      });
      setProblem(data.data.problem);
      setResult(null);
      // Set starter code for selected language
      const starter = data.data.problem?.starterCode?.[language] || STARTER[language] || "";
      setCode(starter);
    } catch (e) {
      console.error("Failed to fetch problem:", e);
    }
  };

  useEffect(() => {
    fetchProblem(questionIndex);
  }, [questionIndex, matchId]);

  // Update code when language changes
  useEffect(() => {
    const starter = problem?.starterCode?.[language] || STARTER[language] || "";
    setCode(starter);
  }, [language]);

  // ── Socket events ──
  useEffect(() => {
    if (!socket || !connected) return;

    socket.emit("match:join", { matchId });

    socket.on("match:update", (data) => {
      setMatchData(data);
      if (data.players) setScoreboard(data.players);
      // Start timer
      if (data.endTime) {
        const left = Math.max(0, Math.floor((new Date(data.endTime) - Date.now()) / 1000));
        setTimeLeft(left);
      }
    });

    socket.on("match:state-changed", ({ status, startTime }) => {
      if (status === "LIVE" && startTime) {
        // 15 min for blitz
        const end = new Date(new Date(startTime).getTime() + 15 * 60 * 1000);
        setTimeLeft(Math.max(0, Math.floor((end - Date.now()) / 1000)));
      }
    });

    socket.on("scoreboard:update", (data) => {
      setScoreboard(data);
    });

    socket.on("match:player-advanced", ({ userId: uid, questionIndex: qi, score }) => {
      setScoreboard((prev) =>
        prev.map((p) =>
          (p.userId?._id || p.userId || p.userId) === uid
            ? { ...p, currentStage: qi, score }
            : p
        )
      );
      if (uid !== user?._id) {
        toast(`Opponent moved to question ${qi + 1}`, { icon: "⚡" });
      }
    });

    // Server tells THIS player to load next question
    socket.on("match:next-question", ({ questionIndex: qi, problem: p }) => {
      setQuestionIndex(qi);
      setProblem(p);
      setResult(null);
      const starter = p?.starterCode?.[language] || STARTER[language] || "";
      setCode(starter);
      toast.success(`Question ${qi + 1} unlocked!`);
    });

    socket.on("submission:result", (res) => {
      if ((res.userId || res.submissionId) && res.userId !== user?._id) return;
      setSubmitting(false);
      setResult(res);
      if (res.passed) {
        toast.success("Correct! Moving to next question...");
      } else {
        toast.error(`Wrong answer — ${res.error || "try again"}`);
      }
    });

    socket.on("match:finished", (data) => {
      setFinished(data);
      setTimeLeft(0);
    });

    socket.on("match:forced-advancement", ({ stage }) => {
      toast.info(`Time's up! Everyone moved to question ${stage + 1}`);
      setSubmitting(false); // clear evaluating state if it was stuck
    });

    socket.on("submit:error", ({ message }) => {
      setSubmitting(false);
      toast.error(message);
    });

    return () => {
      socket.off("match:update");
      socket.off("match:state-changed");
      socket.off("scoreboard:update");
      socket.off("match:player-advanced");
      socket.off("match:next-question");
      socket.off("submission:result");
      socket.off("match:finished");
      socket.off("submit:error");
      socket.emit("match:leave", { matchId });
    };
  }, [socket, connected, matchId, user?._id]);

  // ── Timer countdown ──
  useEffect(() => {
    if (timeLeft <= 0) return;
    timerRef.current = setInterval(() => {
      setTimeLeft((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [timeLeft]);

  // ── Code sync (for replay) ──
  useEffect(() => {
    if (!socket || !connected || !matchId) return;
    const timer = setTimeout(() => {
      socket.emit("code:sync", {
        matchId,
        sourceCode: code,
        language,
      });
    }, 5000); // 5s debounce for minimal DB spam
    return () => clearTimeout(timer);
  }, [code, language, socket, connected]);

  // ── Submit ──
  const handleSubmit = () => {
    if (!problem?._id) return toast.error("Problem not loaded");
    if (!socket) return toast.error("Not connected");
    const src = editorRef.current?.getValue() || code;
    if (!src.trim()) return toast.error("Write some code first");
    setSubmitting(true);
    setResult(null);
    socket.emit("submit:code", {
      matchId,
      problemId: problem._id,
      language,
      sourceCode: src,
    });
  };

  const diff = diffColor(problem?.difficultyRating);
  const myState = scoreboard.find((p) => (p.userId?._id || p.userId) === user?._id);

  // ── Finished overlay ──
  if (finished) {
    const iWon = finished.winnerIds?.some(
      (w) => w?.toString?.() === user?._id?.toString?.()
    );
    return (
      <div className="min-h-screen bg-[#13121B] font-['Satoshi'] flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="text-6xl mb-4">{iWon ? "🏆" : "💀"}</div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-2">
            {iWon ? "You Won!" : "You Lost"}
          </h1>
          <p className="text-[#A9A8B8] text-sm mb-8">Match complete</p>

          {/* Scoreboard */}
          <div className="border border-[#302E46] rounded-xl overflow-hidden mb-6">
            {(finished.finalScoreboard || []).map((p, i) => {
              const isWinner = finished.winnerIds?.some(
                (w) => w?.toString?.() === (p.userId?._id || p.userId)?.toString?.()
              );
              const isMe = (p.userId?._id || p.userId)?.toString?.() === user?._id;
              return (
                <div
                  key={i}
                  className={`flex items-center justify-between px-5 py-4 ${
                    i > 0 ? "border-t border-[#302E46]" : ""
                  } ${isMe ? "bg-violet-50" : "bg-[#181827]"}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{isWinner ? "🥇" : "🥈"}</span>
                    <div>
                      <p className="text-sm font-bold text-white">
                        {p.userId?.name || `Player ${i + 1}`}
                        {isMe && <span className="text-violet-500 ml-1">(you)</span>}
                      </p>
                      <p className="text-xs text-[#A9A8B8]">
                        Q{(p.currentStage || 0) + 1} · {p.wrongAttempts || 0} wrong
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-black text-[#B7FF2A]">{p.score || 0} pts</p>
                </div>
              );
            })}
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate("/lobby")}
              className="flex-1 py-3 border-2 border-[#302E46] text-sm font-semibold rounded-lg hover:border-gray-300 transition-all"
            >
              Play Again
            </button>
            <button
              onClick={() => navigate(`/replay/${matchId}`)}
              className="flex-1 py-3 bg-[#B7FF2A] text-[#13121B] text-sm font-semibold rounded-lg hover:bg-[#1C1A2A] transition-all"
            >
              View Replay
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#13121B] font-['Satoshi'] flex flex-col overflow-hidden text-white">

      {/* ── Top bar ── */}
      <div className="h-14 border-b border-[#302E46] flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-bold text-white">Battle</span>
          <span className="font-bold text-[#B7FF2A]">Arena</span>
          <span className="text-gray-200 mx-1">|</span>
          <span className="text-xs font-semibold text-[#A9A8B8]">Blitz 1v1</span>
          {/* Question progress */}
          <div className="flex items-center gap-1 ml-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`w-6 h-1.5 rounded-full transition-all ${
                  i < questionIndex
                    ? "bg-[rgba(183,255,42,0.1)]0"
                    : i === questionIndex
                    ? "bg-[#B7FF2A]"
                    : "bg-gray-200"
                }`}
              />
            ))}
            <span className="text-xs text-[#A9A8B8] ml-1">Q{questionIndex + 1}/3</span>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Timer */}
          {/* Match Global Timer */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-[10px] uppercase font-bold text-[#A9A8B8]">Match ends in</span>
            <div className={`font-mono font-bold text-lg px-4 py-1.5 rounded-xl ${
              timeLeft < 60 ? "bg-red-50 text-red-600 animate-pulse" : "bg-[#1C1A2A] text-white"
            }`}>
              {fmt(timeLeft)}
            </div>
          </div>
          
          {/* Question Interval Timer / Phase */}
          {timeLeft > 0 && questionIndex < 2 && (
            <div className="flex flex-col items-center gap-1">
              <span className="text-[10px] uppercase font-bold text-[#A9A8B8]">Round {questionIndex + 1} Timer</span>
              <div className="bg-violet-50 text-[#B7FF2A] font-mono font-bold text-sm px-3 py-1 rounded-lg border border-violet-100">
                Next Q in: {fmt(timeLeft % 300 || 300)}
              </div>
            </div>
          )}
          {/* Opponent status */}
          {scoreboard.filter((p) => (p.userId?._id || p.userId) !== user?._id).map((p, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-[#A9A8B8]">
              <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-bold">
                {(p.name || p.userId?.name || "?")[0]?.toUpperCase()}
              </div>
              <span>Q{(p.currentStage || 0) + 1}</span>
              <span className="text-gray-300">·</span>
              <span className="font-semibold text-white">{p.score || 0}pts</span>
            </div>
          ))}
          <button
            onClick={() => navigate("/lobby")}
            className="text-xs text-[#A9A8B8] hover:text-red-500 transition-colors"
          >
            Leave
          </button>
        </div>
      </div>

      {/* ── Main split ── */}
      <div className="flex-1 flex overflow-hidden">

        {/* ── Left: Problem ── */}
        <div className="w-[42%] border-r border-[#302E46] overflow-y-auto p-6 space-y-5">
          {problem ? (
            <>
              {/* Title + difficulty */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${diff.bg} ${diff.text}`}>
                    {problem.difficulty} · {problem.difficultyRating}
                  </span>
                  {problem.tags?.slice(0, 3).map((t) => (
                    <span key={t} className="text-xs text-[#A9A8B8] bg-[#1C1A2A] px-2 py-0.5 rounded-full">
                      {t}
                    </span>
                  ))}
                </div>
                <h2 className="text-xl font-bold text-white">{problem.title}</h2>
              </div>

              {/* Description */}
              <div className="text-sm text-[#A9A8B8] leading-relaxed whitespace-pre-wrap">
                {problem.description}
              </div>

              {/* Constraints */}
              {problem.constraints && (
                <div className="bg-[#1C1A2A] rounded-lg p-4 border border-[#302E46]">
                  <p className="text-xs font-semibold text-[#A9A8B8] uppercase tracking-wide mb-1">Constraints</p>
                  <p className="text-xs font-mono text-[#A9A8B8] whitespace-pre-wrap">{problem.constraints}</p>
                </div>
              )}

              {/* Examples */}
              {problem.examples?.length > 0 && (
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-[#A9A8B8] uppercase tracking-wide">Examples</p>
                  {problem.examples.map((ex, i) => (
                    <div key={i} className="bg-[#1C1A2A] rounded-lg p-4 border border-[#302E46] font-mono text-xs space-y-1">
                      <div><span className="text-[#A9A8B8]">Input: </span><span className="text-white">{ex.input}</span></div>
                      <div><span className="text-[#A9A8B8]">Output: </span><span className="text-[#B7FF2A] font-bold">{ex.output}</span></div>
                      {ex.explanation && <div className="text-[#A9A8B8] font-sans">{ex.explanation}</div>}
                    </div>
                  ))}
                </div>
              )}

              {/* Visible test cases */}
              {problem.testCases?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-[#A9A8B8] uppercase tracking-wide">Sample Test Cases</p>
                  {problem.testCases.map((tc, i) => (
                    <div key={i} className="bg-[#1C1A2A] rounded-lg p-3 border border-[#302E46] font-mono text-xs space-y-1">
                      <div><span className="text-[#A9A8B8]">Input: </span><pre className="inline whitespace-pre-wrap text-white">{tc.input}</pre></div>
                      <div><span className="text-[#A9A8B8]">Expected: </span><pre className="inline whitespace-pre-wrap text-[#B7FF2A]">{tc.expectedOutput}</pre></div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="space-y-3">
              <div className="h-6 bg-[#1C1A2A] rounded animate-pulse w-1/3" />
              <div className="h-4 bg-[#1C1A2A] rounded animate-pulse" />
              <div className="h-4 bg-[#1C1A2A] rounded animate-pulse w-4/5" />
              <div className="h-4 bg-[#1C1A2A] rounded animate-pulse w-3/5" />
            </div>
          )}
        </div>

        {/* ── Right: Editor + Result ── */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Editor toolbar */}
          <div className="h-12 border-b border-[#302E46] flex items-center justify-between px-4 shrink-0">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="text-xs font-semibold bg-[#1C1A2A] border-0 rounded-lg px-3 py-1.5 text-white outline-none cursor-pointer"
            >
              <option value="javascript">JavaScript</option>
              <option value="python">Python</option>
              <option value="cpp">C++</option>
              <option value="java">Java</option>
            </select>

            <button
              onClick={handleSubmit}
              disabled={submitting || !problem}
              className="flex items-center gap-2 bg-[#B7FF2A] hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-1.5 rounded-lg text-xs font-bold transition-all"
            >
              {submitting ? (
                <>
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Evaluating...
                </>
              ) : "Submit"}
            </button>
          </div>

          {/* Monaco Editor */}
          <div className="flex-1 overflow-hidden">
            <Editor
              height="100%"
              language={language === "cpp" ? "cpp" : language}
              value={code}
              onChange={(v) => setCode(v || "")}
              onMount={(editor) => { editorRef.current = editor; }}
              theme="light"
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
                lineHeight: 22,
                padding: { top: 12 },
                scrollBeyondLastLine: false,
                wordWrap: "on",
              }}
            />
          </div>

          {/* Result panel */}
          {result && (
            <div className={`border-t shrink-0 px-5 py-4 ${result.passed ? "bg-[rgba(183,255,42,0.1)] border-[rgba(183,255,42,0.2)]" : "bg-red-50 border-red-100"}`}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{result.passed ? "✅" : "❌"}</span>
                  <span className={`text-sm font-bold ${result.passed ? "text-emerald-700" : "text-red-700"}`}>
                    {result.passed ? "Accepted" : "Wrong Answer"}
                  </span>
                  {result.runtime && (
                    <span className="text-xs text-[#A9A8B8]">{Math.round(result.runtime)}ms</span>
                  )}
                </div>
                <button onClick={() => setResult(null)} className="text-[#A9A8B8] hover:text-[#A9A8B8] text-xs">
                  ✕
                </button>
              </div>
              {result.error && (
                <pre className="text-xs text-red-600 bg-red-100 rounded p-2 overflow-x-auto whitespace-pre-wrap">
                  {result.error}
                </pre>
              )}
              {!result.passed && result.failedTestCase && (
                <div className="text-xs font-mono space-y-1 mt-2">
                  <div><span className="text-[#A9A8B8]">Input: </span>{result.failedTestCase.input}</div>
                  <div><span className="text-[#A9A8B8]">Expected: </span><span className="text-[#B7FF2A]">{result.failedTestCase.expected}</span></div>
                  <div><span className="text-[#A9A8B8]">Got: </span><span className="text-red-600">{result.failedTestCase.got || "(empty)"}</span></div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Match;
