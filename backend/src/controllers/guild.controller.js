import { asyncHandler } from "../utils/async-handler.js";
import { ApiResponse } from "../utils/api-response.js";
import * as guildService from "../services/guild.service.js";

/**
 * POST /api/guilds/create
 * Create a new guild. Authenticated.
 */
export const createGuild = asyncHandler(async (req, res) => {
  const { name, description } = req.body;
  const guild = await guildService.createGuild(req.user._id, name, description);
  return res.status(201).json(new ApiResponse(201, guild, "Guild created successfully"));
});

/**
 * POST /api/guilds/join
 * Join an existing guild. Authenticated.
 */
export const joinGuild = asyncHandler(async (req, res) => {
  const { guildId } = req.body;
  const guild = await guildService.joinGuild(req.user._id, guildId);
  return res.status(200).json(new ApiResponse(200, guild, "Joined guild successfully"));
});

/**
 * POST /api/guilds/leave
 * Leave the current guild. Authenticated.
 */
export const leaveGuild = asyncHandler(async (req, res) => {
  const guild = await guildService.leaveGuild(req.user._id);
  return res.status(200).json(new ApiResponse(200, guild, "Left guild successfully"));
});

/**
 * GET /api/guilds/:guildId
 * Get a guild by id. Authenticated.
 */
export const getGuild = asyncHandler(async (req, res) => {
  const { guildId } = req.params;
  const guild = await guildService.getGuild(guildId);
  return res.status(200).json(new ApiResponse(200, guild, "Guild fetched successfully"));
});

/**
 * GET /api/guilds/leaderboard
 * Public leaderboard — top 50 guilds by rating.
 */
export const getGuildLeaderboard = asyncHandler(async (req, res) => {
  const leaderboard = await guildService.getGuildLeaderboard();
  return res.status(200).json(new ApiResponse(200, leaderboard, "Leaderboard fetched successfully"));
});
