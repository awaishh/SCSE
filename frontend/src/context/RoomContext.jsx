import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useSocket } from "./SocketContext";
import toast from "react-hot-toast";

const RoomContext = createContext(null);

export const RoomProvider = ({ children }) => {
  const { socket } = useSocket();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!socket) return;

    socket.on("room:created", ({ room }) => {
      setRoom(room);
      setLoading(false);
    });

    socket.on("room:joined", ({ room }) => {
      setRoom(room);
      setLoading(false);
    });

    socket.on("room:updated", ({ room }) => {
      setRoom(room);
    });

    socket.on("room:left", () => {
      setRoom(null);
      setLoading(false);
    });

    socket.on("room:error", ({ message }) => {
      toast.error(message);
      setLoading(false);
    });

    socket.on("room:data", ({ room }) => {
      setRoom(room);
      setLoading(false);
    });

    return () => {
      socket.off("room:created");
      socket.off("room:joined");
      socket.off("room:updated");
      socket.off("room:left");
      socket.off("room:error");
      socket.off("room:data");
    };
  }, [socket]);

  const createRoom = useCallback((gameMode, isPrivate = false) => {
    if (!socket) return;
    setLoading(true);
    socket.emit("room:create", { gameMode, isPrivate });
  }, [socket]);

  const joinRoom = useCallback((roomCode) => {
    if (!socket) return;
    setLoading(true);
    socket.emit("room:join", { roomCode });
  }, [socket]);

  const leaveRoom = useCallback(() => {
    if (!socket || !room) return;
    socket.emit("room:leave", { roomId: room._id });
    setRoom(null);
  }, [socket, room]);

  const setTeam = useCallback((teamId) => {
    if (!socket || !room) return;
    socket.emit("room:set-team", { roomId: room._id, teamId });
  }, [socket, room]);

  const startMatch = useCallback(() => {
    if (!socket || !room) return;
    socket.emit("match:start", { roomId: room._id });
  }, [socket, room]);

  const getRoom = useCallback((roomCode) => {
    if (!socket) return;
    setLoading(true);
    socket.emit("room:get", { roomCode });
  }, [socket]);

  return (
    <RoomContext.Provider value={{
      room, loading,
      createRoom, joinRoom, leaveRoom, setTeam, startMatch, getRoom, setRoom,
    }}>
      {children}
    </RoomContext.Provider>
  );
};

export const useRoom = () => useContext(RoomContext);
