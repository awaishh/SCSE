/**
 * Rank tier thresholds and utility for the leaderboard system.
 */

export const RANK_TIERS = ['Bronze', 'Silver', 'Gold', 'Platinum', 'Diamond'];

/**
 * Returns the rank tier string for a given rating value.
 * @param {number} rating
 * @returns {'Bronze'|'Silver'|'Gold'|'Platinum'|'Diamond'}
 */
export const getRankTier = (rating) => {
  if (rating < 1000) return 'Bronze';
  if (rating < 1500) return 'Silver';
  if (rating < 2000) return 'Gold';
  if (rating < 2500) return 'Platinum';
  return 'Diamond';
};
