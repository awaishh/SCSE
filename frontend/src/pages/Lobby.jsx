import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useRoom } from "../context/RoomContext";
import { useSocket } from "../context/SocketContext";
import { Search, Loader2, Code2, Users, Lock, ChevronRight, Terminal } from "lucide-react";
import toast from "react-hot-toast";
import Button from "../components/UI/Button";
import KryptLogo from "../components/UI/KryptLogo";

const MODES = {
  BLITZ_1V1:      { label: "BLITZ 1V1",   sub: "Solo · 2 Players · 15 min", isTeam: false },
  TEAM_DUEL_2V2:  { label: "TEAM 2V2",    sub: "Teams · 4 Players · 30 min", isTeam: true },
  TEAM_DUEL_3V3:  { label: "TEAM 3V3",    sub: "Teams · 6 Players · 30 min", isTeam: true },
};

const Lobby = () => {
  const { createRoom, joinRoom, loading, room } = useRoom();
  const { socket, connected } = useSocket();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialMode = searchParams.get("mode") || "BLITZ_1V1";
  const [gameMode, setGameMode] = useState(MODES[initialMode] ? initialMode : "BLITZ_1V1");
  const [tab, setTab] = useState("public"); // 'public', 'create', 'join'
  const [isPrivate, setIsPrivate] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [searching, setSearching] = useState(false);

  const mode = MODES[gameMode];

  // Auto-redirect if in a private room
  useEffect(() => {
    if (room && tab !== "public") {
      navigate(`/room/${room.roomCode}`, { replace: true });
    }
  }, [room, navigate, tab]);

  // Matchmaking Socket Listeners
  useEffect(() => {
    if (!socket) return;

    const handleSearching = () => setSearching(true);
    const handleCancelled = () => setSearching(false);
    const handleFound = ({ matchId }) => {
      setSearching(false);
      toast.success("Match found! Entering Arena...");
      navigate(`/match/${matchId}`);
    };
    const handleError = (err) => {
      setSearching(false);
      toast.error(err.message || "Matchmaking failed");
    };

    socket.on("matchmaking:searching", handleSearching);
    socket.on("matchmaking:cancelled", handleCancelled);
    socket.on("matchmaking:found", handleFound);
    socket.on("matchmaking:error", handleError);

    return () => {
      socket.off("matchmaking:searching", handleSearching);
      socket.off("matchmaking:cancelled", handleCancelled);
      socket.off("matchmaking:found", handleFound);
      socket.off("matchmaking:error", handleError);
    };
  }, [socket, navigate]);

  const handleSearchToggle = () => {
    if (!connected) return toast.error("Connecting to server...");
    if (searching) {
      socket.emit("matchmaking:cancel", { gameMode });
    } else {
      socket.emit("matchmaking:search", { gameMode });
    }
  };

  const handleCreate = () => {
    if (!connected) return toast.error("Connecting to server...");
    createRoom(gameMode, isPrivate);
  };

  const handleJoin = () => {
    if (!connected) return toast.error("Connecting to server...");
    const code = joinCode.trim().toUpperCase();
    if (code.length !== 6) return toast.error("Enter a valid 6-character room code");
    joinRoom(code);
  };

  return (
    <div className="min-h-[100dvh] bg-[#13121B] text-white font-['Rajdhani'] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_20%_18%,rgba(183,255,42,0.1),transparent_36%),radial-gradient(circle_at_82%_82%,rgba(0,225,255,0.08),transparent_32%)]" />
      <div className="absolute inset-0 pointer-events-none opacity-15 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:40px_40px]" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] flex flex-col items-center opacity-[0.03] pointer-events-none select-none overflow-hidden z-0 whitespace-nowrap leading-[0.8]">
        <span className="text-[14vw] font-black tracking-[-0.04em]">KRYPTCODE</span>
        <span className="text-[14vw] font-black tracking-[-0.04em] ml-[10vw]">BATTLE</span>
        <span className="text-[14vw] font-black tracking-[-0.04em] -ml-[5vw]">ARENA</span>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <section className="mb-8 border-b border-[#2f2b45] pb-7 flex flex-col md:flex-row md:items-end md:justify-between gap-5">
          <div>
            <p className="text-[10px] font-semibold text-[#8f8ca3] uppercase tracking-[0.24em] mb-3">tactical deployment room</p>
            <h1 className="text-3xl sm:text-5xl font-[Oxanium] font-black tracking-tight uppercase">start operation</h1>
            <p className="text-sm text-[#9f9ab4] mt-3 max-w-[56ch]">Pick mode, lock queue strategy, and trigger match start like a pro lobby.</p>
          </div>
          <div className={`flex items-center gap-2 text-[10px] font-bold px-3 py-2 rounded-full uppercase tracking-[0.18em] ${connected ? "bg-[rgba(66,203,126,0.12)] text-[#42cb7e]" : "bg-amber-500/10 text-amber-300"}`}>
            <span className={`w-2 h-2 rounded-full ${connected ? "bg-[#42cb7e] animate-pulse" : "bg-amber-400"}`} />
            {connected ? "network live" : "connecting"}
          </div>
        </section>

        <section className="mb-8 rounded-3xl p-[1px] bg-gradient-to-r from-[#3f3a56] to-[#262337]">
          <div className="rounded-[calc(1.5rem-1px)] bg-[#171624]/95 p-5">
          <p className="text-[10px] font-semibold text-[#8f8ca3] uppercase tracking-[0.24em] mb-4">select combat protocol</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {Object.entries(MODES).map(([key, m]) => (
              <button
                key={key}
                onClick={() => {
                  setGameMode(key);
                  if (searching) {
                    socket.emit("matchmaking:cancel", { gameMode });
                    setSearching(false);
                  }
                }}
                className={`text-left p-4 rounded-2xl border transition-all duration-300 ${
                  gameMode === key
                    ? "border-[#b7ff2a] bg-[linear-gradient(120deg,rgba(183,255,42,0.2),rgba(183,255,42,0.04))]"
                    : "border-[#302E46] bg-[#171624] hover:bg-[#1f1d2d]"
                }`}
              >
                <p className={`text-sm font-[Oxanium] font-black tracking-[0.08em] ${gameMode === key ? "text-[#d9f8a2]" : "text-white"}`}>{m.label}</p>
                <p className="text-[11px] text-[#9f9ab4] mt-2">{m.sub}</p>
              </button>
            ))}
          </div>
          </div>
        </section>

        <section className="mb-8 flex flex-wrap items-center gap-2 border-b border-[#2f2b45] pb-6">
          {[
            { id: "public", label: "Auto Match" },
            { id: "create", label: "Create Room" },
            { id: "join", label: "Join Code" }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => {
                setTab(t.id);
                if (searching) {
                  socket.emit("matchmaking:cancel", { gameMode });
                  setSearching(false);
                }
              }}
              className={`px-4 py-2 rounded-full text-[11px] font-bold uppercase tracking-[0.16em] transition-all ${
                tab === t.id ? "bg-[#b7ff2a] text-[#13121B]" : "bg-[#1b1a29] text-[#a9a8b8] hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </section>

        <section className="w-full flex flex-col items-center">

            {tab === "public" && (
              <div className="w-full flex flex-col items-center py-6">
                <div className="mb-10 text-center">
                  <h2 className="text-4xl md:text-6xl font-black mb-4 tracking-tight font-[Oxanium] uppercase">
                    {mode.label.split(" ")[0]} <span className="text-[#B7FF2A]">{mode.label.split(" ").slice(1).join(" ")}</span>
                  </h2>
                  <p className="text-[#A9A8B8] max-w-xl mx-auto text-sm leading-relaxed">
                    {mode.isTeam
                      ? `Queue up for a ${mode.label} match. You'll be auto-matched with teammates and opponents. Teams are assigned in the room.`
                      : "Instantly pair with another developer. First to solve 3 algorithmic challenges wins. No room codes, pure skill."}
                  </p>
                </div>

                <div className="relative w-full max-w-md">
                  <Button
                    variant="primary"
                    onClick={handleSearchToggle}
                    loading={searching}
                    className={`h-24 w-full text-3xl tracking-[0.4em] !clip-valorant-premium transition-all duration-300 ${
                      searching ? "brightness-110" : "hover:scale-[1.02]"
                    }`}
                  >
                    {searching ? (
                      <div className="flex flex-col items-center">
                        <span className="text-sm font-bold opacity-70 mb-1">CANCEL SEARCH</span>
                        <span className="animate-glitch">QUEUING...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-5">
                        <KryptLogo size={40} className="drop-shadow-[0_0_8px_rgba(183,255,42,0.3)]" />
                        <span>START MATCH</span>
                      </div>
                    )}
                  </Button>
                  
                  {/* Tactical Border Highlights (The HUD "Corners") */}
                  <div className="absolute -top-4 -left-4 w-4 h-4 border-t-2 border-l-2 border-[#B7FF2A]/30" />
                  <div className="absolute -bottom-4 -right-4 w-4 h-4 border-b-2 border-r-2 border-[#B7FF2A]/30" />
                  
                  {searching && (
                    <div className="mt-12 flex flex-col items-center gap-3">
                      <div className="w-full h-1.5 bg-[#1b1a29] relative overflow-hidden clip-valorant-edge">
                        <div className="absolute inset-y-0 left-0 bg-[#B7FF2A] w-1/4 animate-[loading_1.5s_infinite_ease-in-out]" />
                      </div>
                      <div className="flex justify-between w-full px-1">
                        <p className="text-[9px] text-[#B7FF2A]/40 font-black tracking-widest uppercase">matchmaking: active</p>
                        <p className="text-[9px] text-[#B7FF2A]/40 font-black tracking-widest uppercase animate-pulse">pinging servers...</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {tab === "create" && (
              <div className="w-full max-w-xl py-6 rounded-3xl p-[1px] bg-gradient-to-r from-[#3f3a56] to-[#262337]">
                <div className="rounded-[calc(1.5rem-1px)] bg-[#171624]/95 p-6">
                <div className="mb-8 border-b border-[#2f2b45] pb-6">
                  <div className="w-14 h-14 bg-[#1f1d2c] rounded-2xl flex items-center justify-center mb-4">
                    <Users size={32} className="text-[#B7FF2A]" />
                  </div>
                  <h2 className="text-3xl font-black text-white tracking-tight">
                    {mode.isTeam ? `HOST ${mode.label} MATCH` : "HOST PRIVATE MATCH"}
                  </h2>
                  <p className="text-sm text-[#A9A8B8] mt-3 max-w-[58ch]">
                    {mode.isTeam
                      ? "Create a room and invite friends. Assign teams before starting."
                      : "Create a room and invite a friend using a secure code."}
                  </p>
                </div>

                <div className="py-6 border-b border-[#2f2b45] mb-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Lock size={20} className="text-[#A9A8B8]" />
                      <div>
                        <p className="font-bold text-white text-sm">Private Room</p>
                        <p className="text-xs text-[#A9A8B8]">Only joinable via code</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsPrivate(!isPrivate)}
                      className={`w-14 h-7 rounded-full transition-all duration-300 relative shrink-0 shadow-inner ${isPrivate ? "bg-[#B7FF2A] shadow-[0_0_15px_rgba(183,255,42,0.3)]" : "bg-[#302E46]"}`}
                    >
                      <span className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${isPrivate ? "translate-x-7" : "translate-x-0"}`} />
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleCreate}
                  disabled={loading || !connected}
                  className="w-full bg-[#B7FF2A] hover:bg-[#A6F11F] disabled:opacity-50 text-[#13121B] py-4 rounded-full font-black tracking-[0.18em] text-sm flex items-center justify-center gap-2 transition-all"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : "GENERATE ROOM"}
                </button>
                </div>
              </div>
            )}

            {tab === "join" && (
              <div className="w-full max-w-xl py-6 rounded-3xl p-[1px] bg-gradient-to-r from-[#3f3a56] to-[#262337]">
                <div className="rounded-[calc(1.5rem-1px)] bg-[#171624]/95 p-6">
                <div className="mb-8 border-b border-[#2f2b45] pb-6">
                  <div className="w-14 h-14 bg-[#1f1d2c] rounded-2xl flex items-center justify-center mb-4">
                    <Code2 size={32} className="text-[#B7FF2A]" />
                  </div>
                  <h2 className="text-3xl font-black text-white tracking-tight">JOIN ROOM</h2>
                  <p className="text-sm text-[#A9A8B8] mt-3">Enter a 6-character room code to join any game mode.</p>
                </div>

                <div className="mb-8">
                  <input
                    type="text"
                    placeholder="ENTER CODE"
                    maxLength={6}
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    className="w-full bg-[#171624] text-center px-4 py-6 rounded-3xl border border-[#302E46] focus:border-[#B7FF2A] text-4xl text-white font-black tracking-[0.2em] uppercase outline-none transition-all placeholder:text-[#3f3a56]"
                  />
                </div>

                <button
                  onClick={handleJoin}
                  disabled={loading || !connected || joinCode.length !== 6}
                  className="w-full bg-[#B7FF2A] hover:bg-[#a1e520] disabled:bg-[#302E46] disabled:text-[#A9A8B8] text-[#13121B] py-4 rounded-full font-black tracking-[0.18em] text-sm flex items-center justify-center gap-2 transition-all"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : "ENTER ROOM"}
                  {!loading && <ChevronRight size={18} />}
                </button>
                </div>
              </div>
            )}

        </section>
      </div>
    </div>
  );
};

export default Lobby;
