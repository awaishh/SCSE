import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import * as roomService from "../services/room.service.js";
import * as matchService from "../services/match.service.js";
import * as matchmakingService from "../services/matchmaking.service.js";

// ---------------------------------------------------------------------------
// Simple per-socket rate limiter (in-memory, per event type)
// ---------------------------------------------------------------------------
function createRateLimiter() {
  const counters = new Map(); // key: eventName → { count, resetAt }

  /**
   * Check if the event should be allowed.
   * @param {string} eventName
   * @param {number} maxPerSecond - Max allowed calls per second
   * @returns {boolean} true if allowed, false if rate-limited
   */
  return function allow(eventName, maxPerSecond = 10) {
    const now = Date.now();
    const entry = counters.get(eventName);

    if (!entry || now >= entry.resetAt) {
      counters.set(eventName, { count: 1, resetAt: now + 1000 });
      return true;
    }

    entry.count++;
    if (entry.count > maxPerSecond) {
      return false; // rate-limited
    }
    return true;
  };
}

/**
 * Initialise Socket.IO on the given HTTP server.
 * Returns the io instance so it can be stored on the Express app.
 */
export const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:5173",
      credentials: true,
    },
  });

  // --- JWT authentication middleware ---
  // Reads token from handshake auth OR from the accessToken cookie (HttpOnly).
  io.use((socket, next) => {
    // Try auth token first, then fall back to cookie
    let token = socket.handshake.auth?.token;

    if (!token) {
      // Parse cookies from handshake headers
      const cookieHeader = socket.handshake.headers?.cookie || "";
      const match = cookieHeader.match(/(?:^|;\s*)accessToken=([^;]+)/);
      token = match ? match[1] : null;
    }

    if (!token) {
      return next(new Error("Authentication error: no token provided"));
    }

    try {
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      socket.user = decoded;
      next();
    } catch (err) {
      console.error("[Socket Auth] JWT verify failed:", err.message);
      next(new Error("Authentication error: invalid token"));
    }
  });

  // Track disconnect timers for grace-period reconnection
  const disconnectTimers = new Map();

  // --- Connection handler ---
  io.on("connection", (socket) => {
    const userId = socket.user?._id;
    console.log(`[Socket] Connected: ${socket.id} (user: ${userId})`);

    // CRITICAL: Join user-specific room so backend can target this user via io.to(userId)
    if (userId) {
      socket.join(userId.toString());
    }

    // Per-socket rate limiter instance
    const rateLimit = createRateLimiter();

    // Rate limit config: event → max calls per second
    const RATE_LIMITS = {
      "room:create": 2,
      "room:join": 3,
      "room:leave": 3,
      "submit:code": 3,
      "code:sync": 10,
      "match:start": 2,
      "match:end": 2,
      "match:join": 5,
      _default: 15,
    };

    // Wrap socket.on to inject rate limiting for all game events
    const _originalOn = socket.on.bind(socket);
    socket.on = (event, handler) => {
      // Skip rate limiting for internal socket.io events only
      const isWhitelisted = 
        event === "disconnect" || 
        event === "error" || 
        event === "connect";

      if (isWhitelisted) {
        return _originalOn(event, handler);
      }

      return _originalOn(event, async (...args) => {
        const limit = RATE_LIMITS[event] || RATE_LIMITS._default;
        if (!rateLimit(event, limit)) {
          console.warn(`[RateLimit] ${userId} exceeded rate limit for ${event}`);
          return socket.emit("error:rate-limit", { message: `Too many requests for ${event}. Slow down.` });
        }
        return handler(...args);
      });
    };

    // Clear any pending disconnect timer for this user (they reconnected in time)
    if (userId && disconnectTimers.has(userId)) {
      clearTimeout(disconnectTimers.get(userId));
      disconnectTimers.delete(userId);
      console.log(`[Socket] Reconnect detected for user ${userId}, cancelled auto-leave`);
    }

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
        console.log(`[Room] ${room.roomCode} created by ${socket.user._id}`);
      } catch (err) {
        console.error("[Room:Create] Error:", err.message);
        socket.emit("room:error", { message: err.message });
      }
    });

    // -----------------------------------------------------------------------
    // Room: Join
    // Client emits { roomCode } → server adds player, broadcasts updated room
    // -----------------------------------------------------------------------
    socket.on("room:join", async ({ roomCode } = {}) => {
      try {
        if (!roomCode) {
          return socket.emit("room:error", { message: "roomCode is required" });
        }

        const room = await roomService.joinRoom(socket.user._id, roomCode);

        // Subscribe the joining socket to the room channel
        socket.join(room._id.toString());

        // Broadcast updated room state to everyone in the channel
        io.to(room._id.toString()).emit("room:updated", { room });

        // Acknowledge the joining player
        socket.emit("room:joined", { success: true, room });
        console.log(`[Room] ${socket.user._id} joined ${roomCode}`);
      } catch (err) {
        console.error("[Room:Join] Error:", err.message);
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

          // If room was in match and no opponents left, end match
          if (room.status !== "WAITING") {
            const { Match } = await import("../models/match.model.js");
            const match = await Match.findOne({ roomId: room._id, status: "LIVE" });
            if (match) {
              const { endMatch } = await import("../services/match.service.js");
              // End match if everyone left or if it's 1v1 and someone left
              await endMatch(match._id.toString(), io);
              console.log(`[Match] Auto-ending match ${match._id} because a player left.`);
            }
          }
        }

        socket.emit("room:left", { success: true });
      } catch (err) {
        socket.emit("room:error", { message: err.message });
      }
    });

    // -----------------------------------------------------------------------
    // Room: Get (fetch current room state via socket)
    // Client emits { roomCode } → server responds with room data
    // ALSO subscribes the socket to the room channel so they receive updates
    // -----------------------------------------------------------------------
    socket.on("room:get", async ({ roomCode } = {}) => {
      try {
        if (!roomCode) {
          return socket.emit("room:error", { message: "roomCode is required" });
        }

        const room = await roomService.getRoomByCode(roomCode);

        // Subscribe them to the room channel so they get real-time updates
        socket.join(room._id.toString());

        socket.emit("room:data", { room });
      } catch (err) {
        socket.emit("room:error", { message: err.message });
      }
    });

    // -----------------------------------------------------------------------
    // Match: Join (subscribe to match room & receive current match state)
    // Client emits { matchId } → server sends back match data with timer info
    // -----------------------------------------------------------------------
    socket.on("match:join", async ({ matchId } = {}) => {
      try {
        if (!matchId) {
          return socket.emit("match:error", { message: "matchId is required" });
        }

        const match = await matchService.getMatchById(matchId);

        // Subscribe to the room channel so they get real-time match events
        socket.join(match.roomId.toString());

        // Fetch player states for the leaderboard
        const { PlayerState } = await import("../models/playerState.model.js");
        const playerStates = await PlayerState.find({ matchId: match._id })
          .populate("userId", "name avatar");

        // Build player list with names and status
        const players = playerStates.map((ps) => ({
          userId: ps.userId?._id || ps.userId,
          name: ps.userId?.name || "Player",
          teamId: ps.teamId,
          score: ps.score,
          currentStage: ps.currentStage,
          status: ps.status || "PLAYING",
          isAlive: ps.isAlive,
          finishedAt: ps.finishedAt,
        }));

        // Compute endTime for the timer
        // Blitz modes: 15 min, other modes: 30 min (matches _goLive auto-end timer)
        const BLITZ_MODES = ["BLITZ_1V1", "BLITZ_3V3"];
        const durationMs = BLITZ_MODES.includes(match.gameMode) ? 15 * 60 * 1000 : 30 * 60 * 1000;
        const endTime = match.startTime ? new Date(match.startTime.getTime() + durationMs) : null;

        // Send match state to the joining client
        socket.emit("match:update", {
          matchId: match._id,
          mode: match.gameMode,
          status: match.status,
          startTime: match.startTime,
          endTime,
          totalStages: matchService.STAGES.length,
          players,
        });

        console.log(`[Match] ${socket.user._id} joined match ${matchId}`);
      } catch (err) {
        console.error("[Match:Join] Error:", err.message);
        socket.emit("match:error", { message: err.message });
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
    // Only the host or a participant of the match can end it.
    // -----------------------------------------------------------------------
    socket.on("match:end", async ({ matchId } = {}) => {
      try {
        // Authorization: verify the user is a participant or the room host
        const match = await matchService.getMatchById(matchId);
        const isParticipant = match.players.some(
          (p) => (p._id || p).toString() === socket.user._id.toString()
        );

        let isHost = false;
        if (match.roomId) {
          const room = await roomService.getRoomById(match.roomId.toString()).catch(() => null);
          if (room) {
            isHost = room.hostId.toString() === socket.user._id.toString();
          }
        }

        if (!isParticipant && !isHost) {
          return socket.emit("match:error", { message: "You are not authorized to end this match" });
        }

        const ended = await matchService.endMatch(matchId, io);
        socket.emit("match:ended", { success: true, match: ended });
      } catch (err) {
        socket.emit("match:error", { message: err.message });
      }
    });

    // -----------------------------------------------------------------------
    // Match: Leave (client leaving match view, just unsubscribe from room)
    // -----------------------------------------------------------------------
    socket.on("match:leave", async ({ matchId } = {}) => {
      try {
        if (!matchId) return;
        const match = await matchService.getMatchById(matchId).catch(() => null);
        if (match) {
          socket.leave(match.roomId.toString());
        }
        console.log(`[Match] ${socket.user._id} left match ${matchId}`);
      } catch (err) {
        // Non-critical, just log
        console.error("[Match:Leave] Error:", err.message);
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
    // Code: Sync (real-time code updates for replay/spectating)
    // Client emits { matchId, sourceCode, language }
    // -----------------------------------------------------------------------
    socket.on("code:sync", async ({ matchId, sourceCode, language } = {}) => {
      try {
        if (!matchId || sourceCode === undefined) return;
        
        // Record in replay if match is live
        const { Match } = await import("../models/match.model.js");
        const match = await Match.findById(matchId);
        
        if (match && match.status === "LIVE" && match.startTime) {
          const { recordEvent } = await import("../services/replay.service.js");
          await recordEvent(
            matchId,
            "code_update",
            socket.user._id,
            { sourceCode, language },
            match.startTime
          );
        }
      } catch (err) {
        // Silent error for sync events to prevent crashing
        console.error("[code:sync] failed:", err.message);
      }
    });

    // -----------------------------------------------------------------------
    // Matchmaking logic (Public queue)
    // -----------------------------------------------------------------------
    socket.on("matchmaking:search", async ({ gameMode } = {}) => {
      try {
        if (!gameMode) {
          return socket.emit("matchmaking:error", { message: "gameMode is required" });
        }
        await matchmakingService.joinQueue(socket.user._id, socket.id, gameMode, io);
        // We don't emit "found" here unless it matched instantly. The service handles emitting "matchmaking:found".
        socket.emit("matchmaking:searching", { success: true });
      } catch (err) {
        console.error("[Matchmaking] Error:", err.message);
        socket.emit("matchmaking:error", { message: err.message });
      }
    });

    socket.on("matchmaking:cancel", ({ gameMode } = {}) => {
      try {
        matchmakingService.leaveQueue(socket.user._id, gameMode);
        socket.emit("matchmaking:cancelled", { success: true });
      } catch (err) {
        socket.emit("matchmaking:error", { message: err.message });
      }
    });

    // -----------------------------------------------------------------------
    // Legacy channel helpers (kept for backward compatibility)
    // -----------------------------------------------------------------------
    socket.on("join:room", (roomId) => {
      socket.join(roomId);
    });

    socket.on("leave:room", (roomId) => {
      socket.leave(roomId);
    });

    // -----------------------------------------------------------------------
    // Disconnect — uses a grace period so page refreshes don't kick the user
    // -----------------------------------------------------------------------
    socket.on("disconnect", async () => {
      console.log(`[Socket] Disconnected: ${socket.id} (user: ${userId})`);

      if (!userId) return;

      // Remove from matchmaking queues immediately
      matchmakingService.leaveQueue(userId);

      // Give the user 8 seconds to reconnect (e.g. page refresh)
      // before auto-removing them from rooms and ending live matches
      const timer = setTimeout(async () => {
        disconnectTimers.delete(userId);
        try {
          const { Room } = await import("../models/room.model.js");

          // 1. Handle WAITING rooms — remove player cleanly
          const waitingRooms = await Room.find({
            "players.userId": userId,
            status: "WAITING",
          });

          for (const room of waitingRooms) {
            await roomService.leaveRoom(userId, room._id.toString());
            const updated = await roomService
              .getRoomById(room._id.toString())
              .catch(() => null);
            if (updated) {
              io.to(room._id.toString()).emit("room:updated", { room: updated });
            }
          }

          // 2. Handle LIVE matches — auto-end if a player disconnected
          const { Match } = await import("../models/match.model.js");
          const liveMatches = await Match.find({
            players: userId,
            status: "LIVE",
          });

          for (const match of liveMatches) {
            console.log(`[Socket] Auto-ending match ${match._id} because user ${userId} disconnected.`);
            const { endMatch } = await import("../services/match.service.js");
            await endMatch(match._id.toString(), io);
          }
        } catch (e) {
          console.error("[Socket] Auto-leave on disconnect failed:", e.message);
        }
      }, 8000); // 8-second grace period

      disconnectTimers.set(userId, timer);
    });
  });

  return io;
};
