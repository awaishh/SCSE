import { createContext, useContext, useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";

const SocketContext = createContext(null);

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5000";

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  // Store socket in state so consumers re-render when it becomes available
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setSocket(null);
        setConnected(false);
      }
      return;
    }

    // accessToken is HttpOnly — we can't read it from document.cookie.
    // Socket.IO will send cookies automatically via withCredentials.
    // The backend verifyJWT middleware reads from socket.handshake.auth.token
    // OR from cookies. We pass an empty string and rely on cookie transport.
    const s = io(SOCKET_URL, {
      withCredentials: true,
      auth: { token: "" }, // backend falls back to cookie
      transports: ["websocket", "polling"],
    });

    s.on("connect", () => {
      setConnected(true);
      setSocket(s);
    });

    s.on("disconnect", () => {
      setConnected(false);
    });

    s.on("connect_error", (err) => {
      console.error("Socket connect error:", err.message);
    });

    socketRef.current = s;

    return () => {
      s.disconnect();
      socketRef.current = null;
      setSocket(null);
      setConnected(false);
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
