import { Server } from "socket.io";
import jwt from "jsonwebtoken";

/**
 * Initialise Socket.IO on the given HTTP server.
 * Returns the io instance so it can be stored on the Express app.
 */
export const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL,
      credentials: true,
    },
  });

  // --- JWT authentication middleware ---
  // Runs before every connection is established.
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Authentication error"));
    }

    try {
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      socket.user = decoded; // attach decoded payload to socket
      next();
    } catch {
      next(new Error("Authentication error"));
    }
  });

  // --- Connection handler ---
  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id} (user: ${socket.user?._id})`);

    // Client joins a room channel to receive room:updated events
    socket.on("join:room", (roomId) => {
      socket.join(roomId);
      console.log(`Socket ${socket.id} joined room channel: ${roomId}`);
    });

    // Client leaves a room channel
    socket.on("leave:room", (roomId) => {
      socket.leave(roomId);
      console.log(`Socket ${socket.id} left room channel: ${roomId}`);
    });

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};
