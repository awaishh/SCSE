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

  // Retry loop to handle rare roomCode collisions
  let roomCode;
  let attempts = 0;
  while (attempts < 5) {
    const candidate = Room.generateRoomCode();
    const existing = await Room.findOne({ roomCode: candidate });
    if (!existing) {
      roomCode = candidate;
      break;
    }
    attempts++;
  }

  if (!roomCode) {
    throw new ApiError(500, "Failed to generate a unique room code. Please try again.");
  }

  const room = await Room.create({
    roomCode,
    hostId,
    gameMode,
    maxPlayers,
    isPrivate,
    players: [{ userId: hostId, joinedAt: new Date() }],
  });

  return room.populate(PLAYER_POPULATE);
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

  if (room.players.length >= room.maxPlayers) {
    throw new ApiError(400, "Room is full");
  }

  // Check if user is already in the room
  const alreadyJoined = room.players.some((p) => p.userId.toString() === userId.toString());
  if (alreadyJoined) {
    throw new ApiError(400, "Already in room");
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
