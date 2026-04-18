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
      color: { dark: "#B7FF2A", light: "#13121B" },
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

  const borderColor = color === "teamA" ? "border-[#B7FF2A]/30" : color === "teamB" ? "border-[#38BDF8]/30" : "border-[#302E46]";
  const badgeBg = color === "teamA" ? "bg-[rgba(183,255,42,0.1)] text-[#B7FF2A]" : color === "teamB" ? "bg-[rgba(56,189,248,0.1)] text-[#38BDF8]" : "bg-[#1C1A2A] text-[#A9A8B8]";
  const btnColor = "bg-[#B7FF2A] hover:bg-[#A6F11F] shadow-[#B7FF2A]/10";

  return (
    <div className={`border-2 ${borderColor} rounded-xl p-5 flex flex-col items-center gap-4`}>
      <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full ${badgeBg}`}>
        {title}
      </span>
      <p className="text-xs text-[#A9A8B8] text-center">{subtitle}</p>
      {qr ? (
        <img src={qr} alt={title} className="rounded-lg" style={{ width: 160, height: 160 }} />
      ) : (
        <div className="w-40 h-40 bg-[#1C1A2A] rounded-lg animate-pulse" />
      )}
      <button
        onClick={copy}
        className={`w-full text-[#13121B] text-xs font-semibold py-2 rounded-lg transition-all shadow-lg ${btnColor}`}
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
      <div className="min-h-screen bg-[#13121B] font-['Rajdhani'] flex items-center justify-center">
        <span className="w-6 h-6 border-2 border-[#B7FF2A] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-[#13121B] font-['Rajdhani'] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#A9A8B8] text-sm">Room not found</p>
          <button onClick={() => navigate("/lobby")} className="mt-4 text-[#B7FF2A] text-sm font-semibold">
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
    <div className="min-h-screen bg-[#13121B] text-white font-['Rajdhani']">
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-8">

        {/* Room info */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{room.gameMode?.replace(/_/g, " ")}</h1>
            <p className="text-sm text-[#A9A8B8] mt-0.5">
              {room.players?.length} / {room.maxPlayers} players · {room.isPrivate ? "Private" : "Public"}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full ${
              room.status === "WAITING" ? "bg-[rgba(245,158,11,0.1)] text-amber-400" : "bg-[rgba(183,255,42,0.1)] text-[#B7FF2A]"
            }`}>
              {room.status}
            </span>
            <button
              onClick={() => { leaveRoom(); navigate("/lobby"); }}
              className="text-xs text-[#A9A8B8] hover:text-red-500 transition-colors font-semibold"
            >
              Leave Room
            </button>
          </div>
        </div>

        {/* Players list */}
        <div>
          <p className="text-xs font-semibold text-[#A9A8B8] uppercase tracking-wide mb-3">Players</p>
          <div className="grid grid-cols-2 gap-2">
            {room.players?.map((p) => {
              const pid = p.userId?._id || p.userId;
              const pname = p.userId?.name || "Player";
              const isMe = pid === user?._id;
              const isHostPlayer = room.hostId === pid || room.hostId?._id === pid;
              return (
                <div key={pid} className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${isMe ? "border-[#B7FF2A]/30 bg-[rgba(183,255,42,0.05)]" : "border-[#302E46] bg-[#1C1A2A]"}`}>
                  <div className="w-8 h-8 rounded-full bg-[#302E46] flex items-center justify-center text-xs font-bold text-[#A9A8B8]">
                    {pname[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{pname} {isMe && <span className="text-[#B7FF2A]">(you)</span>}</p>
                    {isTeamMode && p.teamId && (
                      <p className={`text-xs font-bold ${p.teamId === "A" ? "text-[#B7FF2A]" : "text-[#38BDF8]"}`}>
                        Team {p.teamId}
                      </p>
                    )}
                  </div>
                  {isHostPlayer && <span className="text-[10px] bg-[rgba(245,158,11,0.15)] text-amber-400 font-bold px-1.5 py-0.5 rounded">HOST</span>}
                </div>
              );
            })}
            {/* Empty slots */}
            {Array.from({ length: Math.max(0, (room.maxPlayers || 0) - (room.players?.length || 0)) }).map((_, i) => (
              <div key={`empty-${i}`} className="flex items-center gap-3 px-4 py-3 rounded-lg border border-dashed border-[#302E46]">
                <div className="w-8 h-8 rounded-full bg-[#1C1A2A] border-2 border-dashed border-[#302E46]" />
                <p className="text-sm text-[#A9A8B8]">Waiting...</p>
              </div>
            ))}
          </div>
        </div>

        {/* Team assignment (team modes only) */}
        {isTeamMode && (
          <div>
            <p className="text-xs font-semibold text-[#A9A8B8] uppercase tracking-wide mb-3">Your Team</p>
            <div className="flex gap-3">
              <button
                onClick={() => setTeam("A")}
                className={`flex-1 py-3 rounded-lg border-2 text-sm font-bold transition-all ${
                  myTeam === "A" ? "border-[#B7FF2A] bg-[rgba(183,255,42,0.1)] text-[#B7FF2A]" : "border-[#302E46] text-[#A9A8B8] hover:border-[#B7FF2A]/50"
                }`}
              >
                Team A
              </button>
              <button
                onClick={() => setTeam("B")}
                className={`flex-1 py-3 rounded-lg border-2 text-sm font-bold transition-all ${
                  myTeam === "B" ? "border-[#38BDF8] bg-[rgba(56,189,248,0.1)] text-[#38BDF8]" : "border-[#302E46] text-[#A9A8B8] hover:border-[#38BDF8]/50"
                }`}
              >
                Team B
              </button>
            </div>
          </div>
        )}

        {/* QR Codes */}
        <div>
          <p className="text-xs font-semibold text-[#A9A8B8] uppercase tracking-wide mb-3">Invite via QR</p>
          {isTeamMode ? (
            <div className="grid grid-cols-2 gap-4">
              <QRCard
                title="Join Team A"
                subtitle="Scan to join this room as Team A"
                url={joinTeamAUrl}
                color="teamA"
              />
              <QRCard
                title="Join Team B"
                subtitle="Scan to join this room as Team B"
                url={joinTeamBUrl}
                color="teamB"
              />
            </div>
          ) : (
            <div className="max-w-xs">
              <QRCard
                title="Join Room"
                subtitle="Scan to join this room"
                url={joinAnyUrl}
                color="default"
              />
            </div>
          )}
        </div>

        {/* Start match (host only) */}
        {isHost && room.status === "WAITING" && (
          <div className="border-t border-[#302E46] pt-6">
            <button
              onClick={handleStart}
              disabled={matchStarting}
              className="w-full bg-[#B7FF2A] hover:bg-[#A6F11F] disabled:opacity-60 text-[#13121B] py-4 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2"
            >
              {matchStarting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Starting...
                </>
              ) : "Start Match"}
            </button>
            <p className="text-xs text-[#A9A8B8] text-center mt-2">
              Only you (the host) can start the match
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Room;
