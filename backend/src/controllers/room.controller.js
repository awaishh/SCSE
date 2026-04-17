import { asyncHandler } from "../utils/async-handler.js";
import { ApiResponse } from "../utils/api-response.js";
import * as roomService from "../services/room.service.js";

/**
 * POST /api/rooms/create
 * Creates a new room and notifies the creator via socket.
 */
export const createRoom = asyncHandler(async (req, res) => {
  const { gameMode, isPrivate } = req.body;

  const room = await roomService.createRoom(req.user._id, gameMode, isPrivate);

  // Notify the creating user's socket that their room is ready
  const io = req.app.get("io");
  if (io) {
    io.to(req.user._id.toString()).emit("room:created", room);
  }

  return res.status(201).json(new ApiResponse(201, room, "Room created successfully"));
});

/**
 * POST /api/rooms/join
 * Joins an existing room and broadcasts the updated state to all room members.
 */
export const joinRoom = asyncHandler(async (req, res) => {
  const { roomCode } = req.body;

  const room = await roomService.joinRoom(req.user._id, roomCode);

  // Broadcast updated room state to everyone already in the room channel
  const io = req.app.get("io");
  if (io) {
    io.to(room._id.toString()).emit("room:updated", room);
  }

  return res.status(200).json(new ApiResponse(200, room, "Joined room successfully"));
});

/**
 * POST /api/rooms/leave
 * Removes the user from a room and broadcasts the updated state (or deletion).
 */
export const leaveRoom = asyncHandler(async (req, res) => {
  const { roomId } = req.body;

  const room = await roomService.leaveRoom(req.user._id, roomId);

  // Only emit if the room still exists (not deleted due to being empty)
  const io = req.app.get("io");
  if (io && room) {
    io.to(room._id.toString()).emit("room:updated", room);
  }

  return res.status(200).json(new ApiResponse(200, room, "Left room successfully"));
});

/**
 * GET /api/rooms/:roomCode
 * Returns the current state of a room by its short code.
 */
export const getRoom = asyncHandler(async (req, res) => {
  const { roomCode } = req.params;

  const room = await roomService.getRoomByCode(roomCode);

  return res.status(200).json(new ApiResponse(200, room, "Room fetched successfully"));
});
