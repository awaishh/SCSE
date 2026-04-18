import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { useRoom } from "../context/RoomContext";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";
import { Search, Loader2, Code2, Users, Lock, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";

const MODES = {
  BLITZ_1V1:      { label: "BLITZ 1V1",   sub: "Solo · 2 Players · 15 min", icon: "⚔️", isTeam: false },
  TEAM_DUEL_2V2:  { label: "TEAM 2V2",    sub: "Teams · 4 Players · 30 min", icon: "🤝", isTeam: true },
  TEAM_DUEL_3V3:  { label: "TEAM 3V3",    sub: "Teams · 6 Players · 30 min", icon: "🏟️", isTeam: true },
};

const Lobby = () => {
  const { createRoom, joinRoom, loading, room } = useRoom();
  const { socket, connected } = useSocket();
  const { user } = useAuth();
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
    <div className="min-h-screen bg-[#13121B] text-white font-['Satoshi'] relative overflow-hidden flex flex-col">
      {/* Background Typography Effect */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] flex flex-col items-center opacity-[0.03] pointer-events-none select-none overflow-hidden z-0 whitespace-nowrap leading-[0.8]">
        <span className="text-[14vw] font-black tracking-[-0.04em]">KRYPTCODE</span>
        <span className="text-[14vw] font-black tracking-[-0.04em] ml-[10vw]">BATTLE</span>
        <span className="text-[14vw] font-black tracking-[-0.04em] -ml-[5vw]">ARENA</span>
      </div>

      {/* Nav */}
      <nav className="relative z-10 border-b border-[#302E46] px-8 py-4 flex justify-between items-center bg-[#13121B]/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Code2 className="text-[#B7FF2A] w-6 h-6" />
          <span className="font-bold text-white tracking-widest text-lg">KRYPTCODE</span>
        </div>
        <div className="flex items-center gap-6">
          <span className={`flex items-center gap-2 text-xs font-bold px-3 py-1.5 rounded-full ${connected ? "bg-green-500/10 text-green-400" : "bg-amber-500/10 text-amber-500"}`}>
            <span className={`w-2 h-2 rounded-full ${connected ? "bg-green-400 animate-pulse" : "bg-amber-500"}`} />
            {connected ? "LIVE" : "CONNECTING"}
          </span>
          <Link to="/dashboard" className="text-sm font-semibold text-[#A9A8B8] hover:text-white transition-colors">
            Exit Arena
          </Link>
        </div>
      </nav>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center p-6">
        {/* Main Interaction Panel */}
        <div className="w-full max-w-4xl bg-[#1C1A2A]/60 backdrop-blur-xl border border-[#302E46] p-2 rounded-3xl shadow-2xl flex flex-col items-center">

          {/* Game Mode Selector */}
          <div className="w-full px-4 pt-4 pb-2">
            <p className="text-[10px] font-bold text-[#A9A8B8] uppercase tracking-widest mb-3">Game Mode</p>
            <div className="flex gap-2">
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
                  className={`flex-1 py-3 px-3 rounded-xl border-2 text-center transition-all ${
                    gameMode === key
                      ? "border-[#B7FF2A] bg-[#B7FF2A]/10"
                      : "border-[#302E46] hover:border-[#A9A8B8]/30"
                  }`}
                >
                  <p className="text-lg mb-1">{m.icon}</p>
                  <p className={`text-xs font-bold tracking-wider ${gameMode === key ? "text-[#B7FF2A]" : "text-white"}`}>{m.label}</p>
                  <p className="text-[9px] text-[#A9A8B8] mt-0.5">{m.sub}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="w-full flex justify-between items-center px-4 py-3">
            <h1 className="text-xl font-bold tracking-widest uppercase">{mode.label}</h1>

            {/* Tabs */}
            <div className="flex bg-[#13121B] p-1 rounded-xl">
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
                  className={`px-6 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                    tab === t.id ? "bg-[#302E46] text-white" : "text-[#A9A8B8] hover:text-white"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="w-full p-8 flex flex-col items-center border-t border-[#302E46]">

            {tab === "public" && (
              <div className="w-full flex flex-col items-center py-10">
                <div className="mb-12 text-center">
                  <h2 className="text-4xl md:text-5xl font-black mb-4">
                    {mode.label.split(" ")[0]} <span className="text-[#B7FF2A]">{mode.label.split(" ").slice(1).join(" ")}</span>
                  </h2>
                  <p className="text-[#A9A8B8] max-w-md mx-auto text-sm leading-relaxed">
                    {mode.isTeam
                      ? `Queue up for a ${mode.label} match. You'll be auto-matched with teammates and opponents. Teams are assigned in the room.`
                      : "Instantly pair with another developer. First to solve 3 algorithmic challenges wins. No room codes, pure skill."}
                  </p>
                </div>

                <button
                  onClick={handleSearchToggle}
                  disabled={!connected}
                  className={`relative group w-64 h-64 rounded-full flex flex-col items-center justify-center transition-all duration-500 overflow-hidden ${
                    searching
                      ? "bg-transparent border-2 border-[#B7FF2A] shadow-[0_0_60px_rgba(183,255,42,0.2)]"
                      : "bg-[#B7FF2A] hover:scale-105 shadow-[0_0_40px_rgba(183,255,42,0.3)] hover:shadow-[0_0_80px_rgba(183,255,42,0.5)]"
                  }`}
                >
                  {searching && (
                    <div className="absolute inset-0 z-0">
                      <div className="absolute inset-0 rounded-full border border-[#B7FF2A]/50 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite]" />
                      <div className="absolute inset-0 rounded-full border border-[#B7FF2A]/30 animate-[ping_2s_cubic-bezier(0,0,0.2,1)_infinite_0.5s]" />
                    </div>
                  )}
                  <div className="relative z-10 flex flex-col items-center">
                    {searching ? (
                      <>
                        <Loader2 size={48} className="text-[#B7FF2A] animate-spin mb-4" />
                        <span className="text-[#B7FF2A] font-black tracking-widest text-lg">SEARCHING</span>
                        <span className="text-xs text-[#B7FF2A]/70 font-semibold mt-2">Click to Cancel</span>
                      </>
                    ) : (
                      <>
                        <Search size={48} className="text-[#13121B] mb-2 scale-100 group-hover:scale-110 transition-transform duration-300" strokeWidth={3} />
                        <span className="text-[#13121B] font-black tracking-widest text-2xl mt-2">FIND</span>
                        <span className="text-[#13121B] font-black tracking-widest text-2xl">MATCH</span>
                      </>
                    )}
                  </div>
                </button>
              </div>
            )}

            {tab === "create" && (
              <div className="w-full max-w-md py-8">
                <div className="mb-8 text-center">
                  <div className="w-16 h-16 bg-[#302E46] rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Users size={32} className="text-[#B7FF2A]" />
                  </div>
                  <h2 className="text-2xl font-black text-white">
                    {mode.isTeam ? `HOST ${mode.label} MATCH` : "HOST PRIVATE MATCH"}
                  </h2>
                  <p className="text-sm text-[#A9A8B8] mt-2">
                    {mode.isTeam
                      ? "Create a room and invite friends. Assign teams before starting."
                      : "Create a room and invite a friend using a secure code."}
                  </p>
                </div>

                <div className="bg-[#13121B] p-6 rounded-2xl border border-[#302E46] mb-8">
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
                      className={`w-14 h-7 rounded-full transition-colors relative shrink-0 ${isPrivate ? "bg-[#B7FF2A]" : "bg-[#302E46]"}`}
                    >
                      <span className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${isPrivate ? "translate-x-8" : "translate-x-1"}`} />
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleCreate}
                  disabled={loading || !connected}
                  className="w-full bg-[#B7FF2A] hover:bg-[#A6F11F] disabled:opacity-50 text-[#13121B] py-4 rounded-xl font-black tracking-widest text-sm flex items-center justify-center gap-2 transition-all"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : "GENERATE ROOM"}
                </button>
              </div>
            )}

            {tab === "join" && (
              <div className="w-full max-w-md py-8">
                 <div className="mb-8 text-center">
                  <div className="w-16 h-16 bg-[#302E46] rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <Code2 size={32} className="text-[#B7FF2A]" />
                  </div>
                  <h2 className="text-2xl font-black text-white">JOIN ROOM</h2>
                  <p className="text-sm text-[#A9A8B8] mt-2">Enter a 6-character room code to join any game mode.</p>
                </div>

                <div className="mb-8">
                  <input
                    type="text"
                    placeholder="ENTER CODE"
                    maxLength={6}
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    className="w-full bg-[#13121B] text-center px-4 py-6 rounded-2xl border-2 border-[#302E46] focus:border-[#B7FF2A] text-4xl text-white font-black tracking-[0.2em] uppercase outline-none transition-all placeholder:text-[#302E46]"
                  />
                </div>

                <button
                  onClick={handleJoin}
                  disabled={loading || !connected || joinCode.length !== 6}
                  className="w-full bg-[#B7FF2A] hover:bg-[#a1e520] disabled:bg-[#302E46] disabled:text-[#A9A8B8] text-[#13121B] py-4 rounded-xl font-black tracking-widest text-sm flex items-center justify-center gap-2 transition-all"
                >
                  {loading ? <Loader2 size={18} className="animate-spin" /> : "ENTER ROOM"}
                  {!loading && <ChevronRight size={18} />}
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default Lobby;
