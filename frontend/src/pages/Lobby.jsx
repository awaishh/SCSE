import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useRoom } from "../context/RoomContext";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const Lobby = () => {
  const { createRoom, joinRoom, loading, room } = useRoom();
  const { connected } = useSocket();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isPrivate, setIsPrivate] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [tab, setTab] = useState("create");

  useEffect(() => {
    if (room) navigate(`/room/${room.roomCode}`, { replace: true });
  }, [room, navigate]);

  const handleCreate = () => {
    if (!connected) return toast.error("Connecting to server...");
    createRoom("BLITZ_1V1", isPrivate);
  };

  const handleJoin = () => {
    if (!connected) return toast.error("Connecting to server...");
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
        <div className="flex items-center gap-4">
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${connected ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-500"}`}>
            {connected ? "● Connected" : "○ Connecting..."}
          </span>
          <Link to="/dashboard" className="text-xs text-gray-400 hover:text-[#111827] transition-colors">
            ← Dashboard
          </Link>
        </div>
      </nav>

      <div className="max-w-lg mx-auto px-6 py-16">
        {/* Header */}
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 bg-violet-50 border border-violet-100 px-3 py-1 rounded-full mb-4">
            <span className="w-2 h-2 bg-violet-600 rounded-full" />
            <span className="text-xs font-semibold text-violet-600 uppercase tracking-wide">Blitz 1v1</span>
          </div>
          <h1 className="text-3xl font-bold text-[#111827] tracking-tight">Game Lobby</h1>
          <p className="text-gray-400 text-sm mt-1">Fast-paced 1v1 coding duel — 3 questions, first to finish wins</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg mb-8 w-fit">
          {[{ id: "create", label: "Create Room" }, { id: "join", label: "Join Room" }].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-6 py-2 rounded-md text-sm font-semibold transition-all ${
                tab === t.id ? "bg-white text-[#111827] shadow-sm" : "text-gray-500 hover:text-[#111827]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "create" ? (
          <div className="space-y-6">
            {/* Mode info card */}
            <div className="border-2 border-violet-200 bg-violet-50/30 rounded-xl p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-[#111827]">Blitz 1v1</p>
                  <p className="text-xs text-gray-400 mt-0.5">2 players · 3 questions · First to solve all wins</p>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-violet-100 text-violet-700">2 players</span>
              </div>
            </div>

            {/* Private toggle */}
            <div className="flex items-center justify-between py-4 border-t border-gray-100">
              <div>
                <p className="text-sm font-semibold text-[#111827]">Private Room</p>
                <p className="text-xs text-gray-400 mt-0.5">Only joinable via room code or QR</p>
              </div>
              <button
                onClick={() => setIsPrivate(!isPrivate)}
                className={`w-12 h-6 rounded-full transition-colors relative shrink-0 ${isPrivate ? "bg-violet-600" : "bg-gray-200"}`}
              >
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${isPrivate ? "translate-x-7" : "translate-x-1"}`} />
              </button>
            </div>

            <button
              onClick={handleCreate}
              disabled={loading || !connected}
              className="w-full bg-[#111827] hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2"
            >
              {loading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Create Room"}
            </button>
          </div>
        ) : (
          <div className="space-y-5">
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
              <p className="text-xs text-gray-400 mt-1.5">Enter the 6-character code shared by your opponent</p>
            </div>

            <button
              onClick={handleJoin}
              disabled={loading || !connected}
              className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-2 shadow-lg shadow-violet-600/20"
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
