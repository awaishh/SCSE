import { Room, GAME_MODES } from "../models/room.model.js";
import { ApiError } from "../utils/api-error.js";

// Fields to populate for each player's user reference
const PLAYER_POPULATE = { path: "players.userId", select: "name avatar" };

/**
 * Create a new room. The host is automatically added as the first player.
 */
export const createRoom = async (hostId, gameMode, isPrivate = false) => {
  // Validate game mode
  if (!GAME_MODES[gameMode]) {
    throw new ApiError(400, `Invalid game mode. Must be one of: ${Object.keys(GAME_MODES).join(", ")}`);
  }

  const maxPlayers = GAME_MODES[gameMode].max;

  // Atomic retry loop: attempt to create directly and retry on duplicate key (E11000)
  const MAX_ATTEMPTS = 5;
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const roomCode = Room.generateRoomCode();
    try {
      const room = await Room.create({
        roomCode,
        hostId,
        gameMode,
        maxPlayers,
        isPrivate,
        players: [{ userId: hostId, joinedAt: new Date() }],
      });
      return room.populate(PLAYER_POPULATE);
    } catch (err) {
      // E11000 = duplicate key error on roomCode — retry with a new code
      if (err.code === 11000 && err.keyPattern?.roomCode) {
        console.warn(`[Room] Code collision on "${roomCode}", retrying (${attempt + 1}/${MAX_ATTEMPTS})`);
        continue;
      }
      // Any other error — rethrow
      throw err;
    }
  }

  throw new ApiError(500, "Failed to generate a unique room code after multiple attempts. Please try again.");
};

/**
 * Join an existing room by its room code.
 */
export const joinRoom = async (userId, roomCode) => {
  const room = await Room.findOne({ roomCode });

  if (!room) {
    throw new ApiError(404, "Room not found");
  }

  if (room.status !== "WAITING") {
    throw new ApiError(400, "Room is not accepting players");
  }

  // Check if user is already in the room
  const alreadyJoined = room.players.some((p) => p.userId.toString() === userId.toString());
  if (alreadyJoined) {
    // If they are already in the room, just return it so they can re-enter (e.g. after refresh)
    return room.populate(PLAYER_POPULATE);
  }

  if (room.players.length >= room.maxPlayers) {
    throw new ApiError(400, "Room is full");
  }

  room.players.push({ userId, joinedAt: new Date() });
  await room.save();

  return room.populate(PLAYER_POPULATE);
};

/**
 * Leave a room. Transfers host if needed; deletes room if empty.
 */
export const leaveRoom = async (userId, roomId) => {
  const room = await Room.findById(roomId);

  if (!room) {
    throw new ApiError(404, "Room not found");
  }

  if (room.status !== "WAITING") {
    throw new ApiError(400, "Cannot leave a room that is in progress");
  }

  // Remove the player from the array
  room.players = room.players.filter((p) => p.userId.toString() !== userId.toString());

  // If no players remain, delete the room
  if (room.players.length === 0) {
    await Room.findByIdAndDelete(roomId);
    return null;
  }

  // Transfer host to the next player if the host left
  if (room.hostId.toString() === userId.toString()) {
    room.hostId = room.players[0].userId;
  }

  await room.save();
  return room.populate(PLAYER_POPULATE);
};

/**
 * Fetch a room by its short room code.
 */
export const getRoomByCode = async (roomCode) => {
  const room = await Room.findOne({ roomCode }).populate(PLAYER_POPULATE);

  if (!room) {
    throw new ApiError(404, "Room not found");
  }

  return room;
};

/**
 * Fetch a room by its MongoDB ObjectId.
 */
export const getRoomById = async (roomId) => {
  const room = await Room.findById(roomId).populate(PLAYER_POPULATE);

  if (!room) {
    throw new ApiError(404, "Room not found");
  }

  return room;
};

/**
 * Set a player's team assignment within a room.
 * Stores the teamId on the player's entry in room.players so it can be
 * transferred to PlayerState when the match starts.
 *
 * @param {string} roomId
 * @param {string} userId
 * @param {string} teamId
 * @returns {Promise<Room>} populated room document
 */
export const setTeamAssignment = async (roomId, userId, teamId) => {
  const room = await Room.findById(roomId);
  if (!room) throw new ApiError(404, 'Room not found');

  const player = room.players.find(p => p.userId.toString() === userId.toString());
  if (!player) throw new ApiError(404, 'Player not in room');

  player.teamId = teamId;
  await room.save();
  return room.populate(PLAYER_POPULATE);
};
