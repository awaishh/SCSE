import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { getMyMatchHistory, getMyDashboardStats } from "../controllers/match.controller.js";

const router = Router();

router.use(verifyJWT);

router.get("/history/me", getMyMatchHistory);
router.get("/stats/me", getMyDashboardStats);

export default router;
