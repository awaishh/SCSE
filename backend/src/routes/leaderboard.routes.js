import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import {
  getGlobalLeaderboard,
  getModeLeaderboard,
  getMyStats,
  getPlayerStats,
} from '../controllers/leaderboard.controller.js';

const router = Router();

// Public routes
router.get('/global', getGlobalLeaderboard);
router.get('/mode/:mode', getModeLeaderboard);
router.get('/player/:userId', getPlayerStats);

// Authenticated route
router.get('/me', verifyJWT, getMyStats);

export default router;
