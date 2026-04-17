import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import * as roomService from "../services/room.service.js";
import * as matchService from "../services/match.service.js";

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

    // -----------------------------------------------------------------------
    // Room: Create
    // Client emits { gameMode, isPrivate } → server creates room, acks creator
    // -----------------------------------------------------------------------
    socket.on("room:create", async ({ gameMode, isPrivate } = {}) => {
      try {
        if (!gameMode) {
          return socket.emit("room:error", { message: "gameMode is required" });
        }

        const room = await roomService.createRoom(
          socket.user._id,
          gameMode,
          isPrivate ?? false
        );

        // Subscribe the creator's socket to the room channel
        socket.join(room._id.toString());

        // Acknowledge the creator
        socket.emit("room:created", { success: true, room });
        console.log(`Room ${room.roomCode} created by ${socket.user._id}`);
      } catch (err) {
        socket.emit("room:error", { message: err.message });
      }
    });

    // -----------------------------------------------------------------------
    // Room: Join
    // Client emits { roomCode } → server adds player, broadcasts updated room
    // -----------------------------------------------------------------------
    socket.on("room:join", async ({ roomCode } = {}) => {
      try {
        const room = await roomService.joinRoom(socket.user._id, roomCode);

        // Subscribe the joining socket to the room channel
        socket.join(room._id.toString());

        // Broadcast updated room state to everyone in the channel
        io.to(room._id.toString()).emit("room:updated", { room });

        // Acknowledge the joining player
        socket.emit("room:joined", { success: true, room });
      } catch (err) {
        socket.emit("room:error", { message: err.message });
      }
    });

    // -----------------------------------------------------------------------
    // Room: Leave
    // Client emits { roomId } → server removes player, broadcasts updated room
    // -----------------------------------------------------------------------
    socket.on("room:leave", async ({ roomId } = {}) => {
      try {
        const room = await roomService.leaveRoom(socket.user._id, roomId);

        // Unsubscribe the socket from the room channel
        socket.leave(roomId);

        if (room) {
          io.to(room._id.toString()).emit("room:updated", { room });
        }

        socket.emit("room:left", { success: true });
      } catch (err) {
        socket.emit("room:error", { message: err.message });
      }
    });

    // -----------------------------------------------------------------------
    // Room: Get (fetch current room state via socket)
    // Client emits { roomCode } → server responds with room data
    // -----------------------------------------------------------------------
    socket.on("room:get", async ({ roomCode } = {}) => {
      try {
        const room = await roomService.getRoomByCode(roomCode);
        socket.emit("room:data", { room });
      } catch (err) {
        socket.emit("room:error", { message: err.message });
      }
    });

    // -----------------------------------------------------------------------
    // Match: Start
    // Client emits { roomId } → server starts match, acks initiator
    // matchService.startMatch validates that socket.user._id is the host
    // -----------------------------------------------------------------------
    socket.on("match:start", async ({ roomId } = {}) => {
      try {
        const match = await matchService.startMatch(
          roomId,
          socket.user._id,
          io
        );
        socket.emit("match:started", { success: true, match });
      } catch (err) {
        socket.emit("match:error", { message: err.message });
      }
    });

    // -----------------------------------------------------------------------
    // Match: End
    // Client emits { matchId } → server ends match, acks initiator
    // -----------------------------------------------------------------------
    socket.on("match:end", async ({ matchId } = {}) => {
      try {
        const match = await matchService.endMatch(matchId, io);
        socket.emit("match:ended", { success: true, match });
      } catch (err) {
        socket.emit("match:error", { message: err.message });
      }
    });

    // -----------------------------------------------------------------------
    // Room: Set Team Assignment
    // Client emits { roomId, teamId } → server updates player's team in room
    // -----------------------------------------------------------------------
    socket.on("room:set-team", async ({ roomId, teamId } = {}) => {
      try {
        const room = await roomService.setTeamAssignment(roomId, socket.user._id, teamId);
        io.to(room._id.toString()).emit("room:updated", { room });
        socket.emit("room:team-set", { success: true, teamId });
      } catch (err) {
        socket.emit("room:error", { message: err.message });
      }
    });

    // -----------------------------------------------------------------------
    // Knockout: Advance Winner
    // Client emits { matchId, winnerId } → server advances bracket
    // -----------------------------------------------------------------------
    socket.on("knockout:advance", async ({ matchId, winnerId } = {}) => {
      try {
        await matchService.advanceKnockoutWinner(matchId, winnerId, io);
        socket.emit("knockout:advance-ack", { success: true });
      } catch (err) {
        socket.emit("match:error", { message: err.message });
      }
    });

    // -----------------------------------------------------------------------
    // Submit: Code (low-latency socket-based submission during live match)
    // Client emits { matchId, problemId, language, sourceCode }
    // -----------------------------------------------------------------------
    socket.on("submit:code", async ({ matchId, problemId, language, sourceCode } = {}) => {
      try {
        if (!matchId || !problemId || !language || !sourceCode) {
          return socket.emit("submit:error", { message: "matchId, problemId, language, sourceCode are required" });
        }
        const { submit } = await import("../services/submission.service.js");
        const submission = await submit(matchId, socket.user._id, problemId, language, sourceCode, io);
        socket.emit("submit:ack", { submissionId: submission._id, verdict: submission.verdict });
      } catch (err) {
        socket.emit("submit:error", { message: err.message });
      }
    });

    // -----------------------------------------------------------------------
    // Legacy channel helpers (kept for backward compatibility)
    // -----------------------------------------------------------------------

    // Client manually joins a room channel to receive room:updated events
    socket.on("join:room", (roomId) => {
      socket.join(roomId);
      console.log(`Socket ${socket.id} joined room channel: ${roomId}`);
    });

    // Client manually leaves a room channel
    socket.on("leave:room", (roomId) => {
      socket.leave(roomId);
      console.log(`Socket ${socket.id} left room channel: ${roomId}`);
    });

    // -----------------------------------------------------------------------
    // Disconnect
    // -----------------------------------------------------------------------
    socket.on("disconnect", async () => {
      console.log(`Socket disconnected: ${socket.id}`);

      if (socket.user) {
        // Notify all room channels this socket was subscribed to
        socket.rooms.forEach((roomId) => {
          if (roomId !== socket.id) {
            io.to(roomId).emit("player:disconnected", {
              userId: socket.user._id,
              timestamp: new Date(),
            });
          }
        });

        // Auto-leave any WAITING rooms so they don't stay stale
        try {
          const { Room } = await import("../models/room.model.js");
          const waitingRooms = await Room.find({
            "players.userId": socket.user._id,
            status: "WAITING",
          });

          for (const room of waitingRooms) {
            await roomService.leaveRoom(
              socket.user._id,
              room._id.toString()
            );
            const updated = await roomService
              .getRoomById(room._id.toString())
              .catch(() => null);
            io.to(room._id.toString()).emit("room:updated", { room: updated });
          }
        } catch (e) {
          console.error("Auto-leave on disconnect failed:", e.message);
        }
      }
    });
  });

  return io;
};
