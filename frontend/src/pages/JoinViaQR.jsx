import { useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useRoom } from "../context/RoomContext";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";

const JoinViaQR = () => {
  const { roomCode } = useParams();
  const [searchParams] = useSearchParams();
  const team = searchParams.get("team");
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { socket } = useSocket();
  const { joinRoom, setTeam, room } = useRoom();

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate(`/login?returnUrl=/join/${roomCode}${team ? `?team=${team}` : ""}`, { replace: true });
      return;
    }
    if (!socket) return;
    joinRoom(roomCode);
  }, [authLoading, user, socket]);

  useEffect(() => {
    if (!room) return;
    if (team) {
      setTeam(team);
    }
    navigate(`/room/${room.roomCode}`, { replace: true });
  }, [room]);

  return (
    <div className="min-h-screen bg-[#13121B] font-['Satoshi'] flex items-center justify-center">
      <div className="text-center">
        <span className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin inline-block" />
        <p className="text-[#A9A8B8] text-sm mt-4">Joining room <span className="font-mono font-bold text-white">{roomCode}</span>...</p>
      </div>
    </div>
  );
};

export default JoinViaQR;
