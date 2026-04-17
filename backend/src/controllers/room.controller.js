import { asyncHandler } from "../utils/async-handler.js";
import { ApiResponse } from "../utils/api-response.js";
import * as roomService from "../services/room.service.js";

/**
 * GET /api/rooms/:roomCode
 * Returns the current state of a room by its short code.
 * Used for initial page load and deep linking.
 * Room mutations (create/join/leave) are handled via Socket.IO events.
 */
export const getRoom = asyncHandler(async (req, res) => {
  const { roomCode } = req.params;

  const room = await roomService.getRoomByCode(roomCode);

  return res.status(200).json(new ApiResponse(200, room, "Room fetched successfully"));
});
