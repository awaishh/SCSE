import * as roomService from "./room.service.js";
import * as matchService from "./match.service.js";

// In-memory queue structure
// Using an object to support different game modes in the future.
// Example: queues['BLITZ_1V1'] = [{ userId, socketId }, ...]
const queues = {};

/**
 * Initialize queue for a game mode if it doesn't exist
 */
const initQueue = (gameMode) => {
  if (!queues[gameMode]) {
    queues[gameMode] = [];
  }
};

/**
 * Adds a user to the matchmaking queue.
 * Checks if a match can be formed immediately.
 * 
 * @param {string} userId - ID of the user searching
 * @param {string} socketId - Socket ID to emit targeted events if needed
 * @param {string} gameMode - Game mode, e.g., 'BLITZ_1V1'
 * @param {object} io - Global Socket.io instance
 */
export const joinQueue = async (userId, socketId, gameMode, io) => {
  initQueue(gameMode);
  const queue = queues[gameMode];

  // Prevent duplicate entries in the queue
  const existingIdx = queue.findIndex((p) => p.userId.toString() === userId.toString());
  if (existingIdx !== -1) {
    // Update socketId just in case they reconnected
    queue[existingIdx].socketId = socketId;
    return false; // Did not form a match yet
  }

  // Add to queue
  queue.push({ userId, socketId });
  console.log(`[Matchmaking] User ${userId} joined queue for ${gameMode}. Queue length: ${queue.length}`);

  // Check if we have enough players for 1v1
  // Expand logic here later if game modes require more players (e.g. 3v3 needs 6 players)
  const requiredPlayers = gameMode === "BLITZ_1V1" ? 2 : 2; // Defaulting to 2 for now

  if (queue.length >= requiredPlayers) {
    // Pop required number of players from the front of the queue
    const playersToMatch = queue.splice(0, requiredPlayers);
    
    // Automatically form the room and start the match
    try {
      await formMatch(playersToMatch, gameMode, io);
    } catch (err) {
      console.error("[Matchmaking] Match formation failed:", err.message);
      // In a robust system, we would put them back in the queue, 
      // but for now, we'll notify them it failed.
      playersToMatch.forEach((p) => {
        io.to(p.userId.toString()).emit("matchmaking:error", { message: "Match formation failed. Please try again." });
      });
    }
  }

  return true;
};

/**
 * Removes a user from the matchmaking queue.
 */
export const leaveQueue = (userId, gameMode) => {
  if (!gameMode) {
    // Leave all queues if mode not specified
    Object.keys(queues).forEach(mode => {
      queues[mode] = queues[mode].filter(p => p.userId.toString() !== userId.toString());
    });
    console.log(`[Matchmaking] User ${userId} left all queues`);
  } else {
    initQueue(gameMode);
    queues[gameMode] = queues[gameMode].filter(p => p.userId.toString() !== userId.toString());
    console.log(`[Matchmaking] User ${userId} left queue for ${gameMode}`);
  }
};

/**
 * Handle match formation logic: Creates room -> players join -> match starts
 */
const formMatch = async (players, gameMode, io) => {
  const hostPlayer = players[0];
  const joiningPlayers = players.slice(1);

  // 1. Create Room (Host)
  const room = await roomService.createRoom(hostPlayer.userId, gameMode, false);
  console.log(`[Matchmaking] Auto-created room ${room.roomCode} for matchmaking.`);

  // 2. Joining Players join the room
  for (const p of joiningPlayers) {
    await roomService.joinRoom(p.userId, room.roomCode);
  }

  // Both should be in the socket room channel technically, we'll make them join later
  // via the matchmaking:found event, OR we can explicitly make their sockets join here.
  // Since we have the `io` and the userIds, their sockets are joined to `userId` rooms.
  // We don't have direct access to their socket objects, so the frontend must listen to matchmaking:found and navigate,
  // which then calls match:join implicitly when the Match page loads.

  // 3. Auto-start the match
  // The startMatch service handles creating the Match document in COUNTDOWN state
  // and starts the 10s timer.
  const match = await matchService.startMatch(room._id, hostPlayer.userId, io);

  // 4. Notify all players
  players.forEach((p) => {
    // Send to the personal user socket channel (which we joined in socket/index.js)
    io.to(p.userId.toString()).emit("matchmaking:found", {
      matchId: match._id.toString(),
      roomId: room._id.toString(),
      roomCode: room.roomCode
    });
  });

  console.log(`[Matchmaking] Successfully initiated match ${match._id} for room ${room.roomCode}`);
};
