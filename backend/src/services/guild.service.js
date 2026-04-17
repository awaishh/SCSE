import { Guild } from "../models/guild.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/api-error.js";

// ─── Internal helper ────────────────────────────────────────────────────────

/**
 * Recalculates guild.guildRating as the average rating of all members.
 * Does NOT save — the caller is responsible for saving.
 */
async function updateGuildRating(guild) {
  const memberIds = guild.members.map((m) => m.userId);
  const users = await User.find({ _id: { $in: memberIds } }).select("rating");

  if (users.length === 0) {
    guild.guildRating = 0;
    return;
  }

  const total = users.reduce((sum, u) => sum + (u.rating ?? 0), 0);
  guild.guildRating = Math.round((total / users.length) * 100) / 100;
}

// ─── Populate helper ─────────────────────────────────────────────────────────

const MEMBER_POPULATE = { path: "members.userId", select: "name avatar rating" };
const OWNER_POPULATE = { path: "ownerId", select: "name avatar" };

// ─── Exported service functions ──────────────────────────────────────────────

/**
 * Create a new guild.
 * @param {string} ownerId - The creating user's _id
 * @param {string} name    - Guild name
 * @param {string} description - Optional description
 */
export async function createGuild(ownerId, name, description = "") {
  // Ensure name is unique
  const existing = await Guild.findOne({ name });
  if (existing) throw new ApiError(409, "Guild name already taken");

  // Ensure user is not already in a guild
  const owner = await User.findById(ownerId);
  if (!owner) throw new ApiError(404, "User not found");
  if (owner.guildId) throw new ApiError(400, "You are already in a guild");

  // Create guild with owner as first member
  const guild = await Guild.create({
    name,
    description,
    ownerId,
    members: [{ userId: ownerId, joinedAt: new Date() }],
    guildRating: owner.rating ?? 0,
  });

  // Link guild to user
  owner.guildId = guild._id;
  await owner.save();

  return guild.populate(MEMBER_POPULATE);
}

/**
 * Join an existing guild.
 * @param {string} userId  - The joining user's _id
 * @param {string} guildId - Target guild _id
 */
export async function joinGuild(userId, guildId) {
  const guild = await Guild.findById(guildId);
  if (!guild) throw new ApiError(404, "Guild not found");

  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");

  if (user.guildId) throw new ApiError(400, "You are already in a guild");

  if (guild.members.length >= guild.maxMembers)
    throw new ApiError(400, "Guild is full");

  // Guard against duplicate membership (shouldn't happen if guildId is kept in sync)
  const alreadyMember = guild.members.some(
    (m) => m.userId.toString() === userId.toString()
  );
  if (alreadyMember) throw new ApiError(400, "Already a member");

  guild.members.push({ userId, joinedAt: new Date() });

  await updateGuildRating(guild);
  await guild.save();

  user.guildId = guild._id;
  await user.save();

  return guild.populate(MEMBER_POPULATE);
}

/**
 * Leave the current guild.
 * Handles ownership transfer and guild deletion when empty.
 * @param {string} userId - The leaving user's _id
 * @returns {Guild|null} Updated guild, or null if the guild was deleted
 */
export async function leaveGuild(userId) {
  const user = await User.findById(userId);
  if (!user) throw new ApiError(404, "User not found");
  if (!user.guildId) throw new ApiError(400, "You are not in a guild");

  const guild = await Guild.findById(user.guildId);
  if (!guild) {
    // Guild already gone — clean up user reference
    user.guildId = null;
    await user.save();
    return null;
  }

  // Remove the leaving user from members
  guild.members = guild.members.filter(
    (m) => m.userId.toString() !== userId.toString()
  );

  // Unlink guild from user
  user.guildId = null;
  await user.save();

  // If no members remain, delete the guild
  if (guild.members.length === 0) {
    await Guild.findByIdAndDelete(guild._id);
    return null;
  }

  // Transfer ownership if the owner is leaving
  if (guild.ownerId.toString() === userId.toString()) {
    // Longest-standing member is members[0] (insertion order preserved)
    guild.ownerId = guild.members[0].userId;
  }

  await updateGuildRating(guild);
  await guild.save();

  return guild.populate(MEMBER_POPULATE);
}

/**
 * Fetch a single guild by id with populated members.
 * @param {string} guildId
 */
export async function getGuild(guildId) {
  const guild = await Guild.findById(guildId).populate(MEMBER_POPULATE);
  if (!guild) throw new ApiError(404, "Guild not found");
  return guild;
}

/**
 * Return the top-50 guilds sorted by guildRating descending.
 * Uses lean() for performance.
 */
export async function getGuildLeaderboard() {
  const guilds = await Guild.find()
    .sort({ guildRating: -1 })
    .limit(50)
    .populate(OWNER_POPULATE)
    .select("name description ownerId guildRating members")
    .lean();

  // Attach memberCount and strip the full members array from the response
  return guilds.map(({ members, ...rest }) => ({
    ...rest,
    memberCount: members.length,
  }));
}
