import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useRoom } from "../context/RoomContext";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const GAME_MODES = [
  { id: "BATTLE_ROYALE", label: "Battle Royale", desc: "2–8 players, elimination-based", players: "2–8" },
  { id: "BLITZ_1V1",     label: "Blitz 1v1",     desc: "Fast-paced 1v1 duel",           players: "2" },
  { id: "BLITZ_3V3",     label: "Blitz 3v3",     desc: "Fast-paced team blitz",          players: "6" },
  { id: "TEAM_DUEL_2V2", label: "Team Duel 2v2", desc: "2v2 team battle",                players: "4" },
  { id: "TEAM_DUEL_3V3", label: "Team Duel 3v3", desc: "3v3 team battle",                players: "6" },
  { id: "ICPC_STYLE",    label: "ICPC Style",    desc: "Penalty-based 3v3 contest",      players: "6" },
  { id: "KNOCKOUT",      label: "Knockout",      desc: "Bracket tournament",             players: "2–8" },
];

const Lobby = () => {
  const { createRoom, joinRoom, loading, room } = useRoom();
  const { connected } = useSocket();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [selectedMode, setSelectedMode] = useState("BATTLE_ROYALE");
  const [isPrivate, setIsPrivate] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [tab, setTab] = useState("create");

  // Navigate to room page once room is created/joined — inside useEffect to avoid render loop
  useEffect(() => {
    if (room) {
      navigate(`/room/${room.roomCode}`, { replace: true });
    }
  }, [room, navigate]);

  const handleCreate = () => {
    if (!connected) return toast.error("Connecting to server... please wait");
    if (!selectedMode) return toast.error("Select a game mode");
    createRoom(selectedMode, isPrivate);
  };

  const handleJoin = () => {
    if (!connected) return toast.error("Connecting to server... please wait");
    const code = joinCode.trim().toUpperCase();
    if (code.length !== 6) return toast.error("Enter a valid 6-character room code");
    joinRoom(code);
  };

  return (
    <div className="min-h-screen bg-white text-[#111827]">
      {/* Nav */}
      <nav className="border-b border-gray-100 px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="font-bold text-[#111827]">Battle</span>
          <span className="font-bold text-violet-600">Arena</span>
        </div>
        <span className="text-sm text-gray-500">Welcome, <span className="font-semibold text-[#111827]">{user?.name}</span></span>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${connected ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-500"}`}>
          {connected ? "● Connected" : "○ Connecting..."}
        </span>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-[#111827] tracking-tight">Game Lobby</h1>
          <p className="text-gray-500 text-sm mt-1">Create a room or join one with a code</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg mb-8 w-fit">
          {["create", "join"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-6 py-2 rounded-md text-sm font-semibold transition-all capitalize ${
                tab === t
                  ? "bg-white text-[#111827] shadow-sm"
                  : "text-gray-500 hover:text-[#111827]"
              }`}
            >
              {t === "create" ? "Create Room" : "Join Room"}
            </button>
          ))}
        </div>

        {tab === "create" ? (
          <div className="space-y-6">
            {/* Mode selector */}
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Game Mode
              </label>
              <div className="grid grid-cols-1 gap-2">
                {GAME_MODES.map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setSelectedMode(mode.id)}
                    className={`flex items-center justify-between px-4 py-3 rounded-lg border-2 text-left transition-all ${
                      selectedMode === mode.id
                        ? "border-violet-600 bg-violet-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div>
                      <p className={`text-sm font-semibold ${selectedMode === mode.id ? "text-violet-700" : "text-[#111827]"}`}>
                        {mode.label}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">{mode.desc}</p>
                    </div>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                      selectedMode === mode.id ? "bg-violet-100 text-violet-700" : "bg-gray-100 text-gray-500"
                    }`}>
                      {mode.players}p
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Private toggle */}
            <div className="flex items-center justify-between py-3 border-t border-gray-100">
              <div>
                <p className="text-sm font-semibold text-[#111827]">Private Room</p>
                <p className="text-xs text-gray-400">Only joinable via room code or QR</p>
              </div>
              <button
                onClick={() => setIsPrivate(!isPrivate)}
                className={`w-12 h-6 rounded-full transition-colors relative flex-shrink-0 ${isPrivate ? "bg-violet-600" : "bg-gray-200"}`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${isPrivate ? "translate-x-7" : "translate-x-1"}`} />
              </button>
            </div>

            <button
              onClick={handleCreate}
              disabled={loading}
              className="w-full bg-[#111827] hover:bg-gray-800 disabled:opacity-60 text-white py-3.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2"
            >
              {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Create Room"}
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">
                Room Code
              </label>
              <input
                type="text"
                placeholder="e.g. AB12CD"
                maxLength={6}
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-violet-600 text-sm text-[#111827] font-mono tracking-widest uppercase outline-none transition-all"
              />
              <p className="text-xs text-gray-400 mt-1.5">Enter the 6-character code shared by the host</p>
            </div>

            <button
              onClick={handleJoin}
              disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-60 text-white py-3.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-600/20"
            >
              {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Join Room"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Lobby;
