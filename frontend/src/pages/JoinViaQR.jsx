/**
 * JoinViaQR — handles deep-link QR scans.
 * URL format: /join/:roomCode?team=A or /join/:roomCode?team=B
 *
 * If user is logged in → join room (+ set team if param present) → redirect to /room/:roomCode
 * If not logged in → redirect to /login with returnUrl
 */
import { useEffect } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import { useRoom } from "../context/RoomContext";
import { useAuth } from "../context/AuthContext";
import { useSocket } from "../context/SocketContext";

const JoinViaQR = () => {
  const { roomCode } = useParams();
  const [searchParams] = useSearchParams();
  const team = searchParams.get("team"); // "A" | "B" | null
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { socket } = useSocket();
  const { joinRoom, setTeam, room } = useRoom();

  useEffect(() => {
    if (authLoading) return;

    // Not logged in — send to login with return URL
    if (!user) {
      navigate(`/login?returnUrl=/join/${roomCode}${team ? `?team=${team}` : ""}`, { replace: true });
      return;
    }

    if (!socket) return;

    // Join the room
    joinRoom(roomCode);
  }, [authLoading, user, socket]);

  // Once room is set, set team if needed then navigate
  useEffect(() => {
    if (!room) return;
    if (team) {
      setTeam(team);
    }
    navigate(`/room/${room.roomCode}`, { replace: true });
  }, [room]);

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center">
        <span className="w-8 h-8 border-2 border-violet-600 border-t-transparent rounded-full animate-spin inline-block" />
        <p className="text-sm text-gray-400 mt-4">
          Joining room <span className="font-mono font-bold text-[#111827]">{roomCode}</span>
          {team && <span className="text-violet-600"> · Team {team}</span>}
          ...
        </p>
      </div>
    </div>
  );
};

export default JoinViaQR;
