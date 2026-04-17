import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import QRCode from "qrcode";
import { useRoom } from "../context/RoomContext";
import { useSocket } from "../context/SocketContext";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";

const BASE_URL = window.location.origin;

// Generate QR as data URL
const generateQR = async (text) => {
  try {
    return await QRCode.toDataURL(text, {
      width: 180,
      margin: 2,
      color: { dark: "#111827", light: "#ffffff" },
    });
  } catch {
    return null;
  }
};

const QRCard = ({ title, subtitle, url, color = "violet" }) => {
  const [qr, setQr] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    generateQR(url).then(setQr);
  }, [url]);

  const copy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const borderColor = color === "violet" ? "border-violet-200" : "border-emerald-200";
  const badgeBg = color === "violet" ? "bg-violet-50 text-violet-700" : "bg-emerald-50 text-emerald-700";
  const btnColor = color === "violet"
    ? "bg-violet-600 hover:bg-violet-700 shadow-violet-600/20"
    : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20";

  return (
    <div className={`border-2 ${borderColor} rounded-xl p-5 flex flex-col items-center gap-4`}>
      <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full ${badgeBg}`}>
        {title}
      </span>
      <p className="text-xs text-gray-400 text-center">{subtitle}</p>
      {qr ? (
        <img src={qr} alt={title} className="rounded-lg" style={{ width: 160, height: 160 }} />
      ) : (
        <div className="w-40 h-40 bg-gray-100 rounded-lg animate-pulse" />
      )}
      <button
        onClick={copy}
        className={`w-full text-white text-xs font-semibold py-2 rounded-lg transition-all shadow-lg ${btnColor}`}
      >
        {copied ? "Copied!" : "Copy Link"}
      </button>
    </div>
  );
};

const Room = () => {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { room, getRoom, leaveRoom, setTeam, startMatch, loading } = useRoom();
  const { socket } = useSocket();
  const { user } = useAuth();
  const [matchStarting, setMatchStarting] = useState(false);
  const fetched = useRef(false);

  // Fetch room on mount if not already in context
  // Also re-fetch when socket becomes available (reconnection case)
  useEffect(() => {
    if (!socket) return;
    if (!room && !fetched.current) {
      fetched.current = true;
      getRoom(roomCode);
    } else if (room) {
      // Re-subscribe to room channel on reconnect
      socket.emit("room:get", { roomCode });
    }
  }, [socket, room, roomCode, getRoom]);

  // Listen for match start
  useEffect(() => {
    if (!socket) return;
    socket.on("match:state-changed", ({ status, matchId }) => {
      if (status === "COUNTDOWN" || status === "LIVE") {
        navigate(`/match/${matchId}`);
      }
    });
    socket.on("match:error", ({ message }) => {
      toast.error(message);
      setMatchStarting(false);
    });
    return () => {
      socket.off("match:state-changed");
      socket.off("match:error");
    };
  }, [socket, navigate]);

  if (loading && !room) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <span className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-400 text-sm">Room not found</p>
          <button onClick={() => navigate("/lobby")} className="mt-4 text-violet-600 text-sm font-semibold">
            Back to Lobby
          </button>
        </div>
      </div>
    );
  }

  const isHost = room.hostId === user?._id || room.hostId?._id === user?._id;
  const isTeamMode = ["TEAM_DUEL_2V2", "TEAM_DUEL_3V3", "ICPC_STYLE", "BLITZ_3V3"].includes(room.gameMode);
  const myPlayer = room.players?.find(p => (p.userId?._id || p.userId) === user?._id);
  const myTeam = myPlayer?.teamId;

  // QR URLs
  const joinAnyUrl = `${BASE_URL}/join/${room.roomCode}`;
  const joinTeamAUrl = `${BASE_URL}/join/${room.roomCode}?team=A`;
  const joinTeamBUrl = `${BASE_URL}/join/${room.roomCode}?team=B`;

  const handleStart = () => {
    setMatchStarting(true);
    startMatch();
  };

  return (
    <div className="min-h-screen bg-white text-[#111827]">
      {/* Nav */}
      <nav className="border-b border-gray-100 px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="font-bold">Battle</span>
          <span className="font-bold text-violet-600">Arena</span>
          <span className="mx-2 text-gray-200">|</span>
          <span className="text-sm text-gray-500">Room</span>
          <span className="ml-2 font-mono font-bold text-sm bg-gray-100 px-2 py-0.5 rounded">{room.roomCode}</span>
        </div>
        <button
          onClick={() => { leaveRoom(); navigate("/lobby"); }}
          className="text-xs text-gray-400 hover:text-red-500 transition-colors font-semibold"
        >
          Leave Room
        </button>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">

        {/* Room info */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{room.gameMode?.replace(/_/g, " ")}</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {room.players?.length} / {room.maxPlayers} players · {room.isPrivate ? "Private" : "Public"}
            </p>
          </div>
          <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full ${
            room.status === "WAITING" ? "bg-amber-50 text-amber-600" : "bg-green-50 text-green-600"
          }`}>
            {room.status}
          </span>
        </div>

        {/* Players list */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Players</p>
          <div className="grid grid-cols-2 gap-2">
            {room.players?.map((p) => {
              const pid = p.userId?._id || p.userId;
              const pname = p.userId?.name || "Player";
              const isMe = pid === user?._id;
              const isHostPlayer = room.hostId === pid || room.hostId?._id === pid;
              return (
                <div key={pid} className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${isMe ? "border-violet-200 bg-violet-50" : "border-gray-100 bg-gray-50"}`}>
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                    {pname[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{pname} {isMe && <span className="text-violet-500">(you)</span>}</p>
                    {isTeamMode && p.teamId && (
                      <p className={`text-xs font-bold ${p.teamId === "A" ? "text-violet-600" : "text-emerald-600"}`}>
                        Team {p.teamId}
                      </p>
                    )}
                  </div>
                  {isHostPlayer && <span className="text-[10px] bg-amber-100 text-amber-600 font-bold px-1.5 py-0.5 rounded">HOST</span>}
                </div>
              );
            })}
            {/* Empty slots */}
            {Array.from({ length: Math.max(0, (room.maxPlayers || 0) - (room.players?.length || 0)) }).map((_, i) => (
              <div key={`empty-${i}`} className="flex items-center gap-3 px-4 py-3 rounded-lg border border-dashed border-gray-200">
                <div className="w-8 h-8 rounded-full bg-gray-100 border-2 border-dashed border-gray-200" />
                <p className="text-sm text-gray-300">Waiting...</p>
              </div>
            ))}
          </div>
        </div>

        {/* Team assignment (team modes only) */}
        {isTeamMode && (
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Your Team</p>
            <div className="flex gap-3">
              <button
                onClick={() => setTeam("A")}
                className={`flex-1 py-3 rounded-lg border-2 text-sm font-bold transition-all ${
                  myTeam === "A" ? "border-violet-600 bg-violet-50 text-violet-700" : "border-gray-200 text-gray-500 hover:border-violet-300"
                }`}
              >
                Team A
              </button>
              <button
                onClick={() => setTeam("B")}
                className={`flex-1 py-3 rounded-lg border-2 text-sm font-bold transition-all ${
                  myTeam === "B" ? "border-emerald-600 bg-emerald-50 text-emerald-700" : "border-gray-200 text-gray-500 hover:border-emerald-300"
                }`}
              >
                Team B
              </button>
            </div>
          </div>
        )}

        {/* QR Codes */}
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Invite via QR</p>
          {isTeamMode ? (
            <div className="grid grid-cols-2 gap-4">
              <QRCard
                title="Join Team A"
                subtitle="Scan to join this room as Team A"
                url={joinTeamAUrl}
                color="violet"
              />
              <QRCard
                title="Join Team B"
                subtitle="Scan to join this room as Team B"
                url={joinTeamBUrl}
                color="emerald"
              />
            </div>
          ) : (
            <div className="max-w-xs">
              <QRCard
                title="Join Room"
                subtitle="Scan to join this room"
                url={joinAnyUrl}
                color="violet"
              />
            </div>
          )}
        </div>

        {/* Start match (host only) */}
        {isHost && room.status === "WAITING" && (
          <div className="border-t border-gray-100 pt-6">
            <button
              onClick={handleStart}
              disabled={matchStarting}
              className="w-full bg-[#111827] hover:bg-gray-800 disabled:opacity-60 text-white py-4 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2"
            >
              {matchStarting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Starting...
                </>
              ) : "Start Match"}
            </button>
            <p className="text-xs text-gray-400 text-center mt-2">
              Only you (the host) can start the match
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Room;
