import dotenv from "dotenv";
import { createServer } from "http";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import connectDb from "./db/index.js";
import authRouter from "./routes/auth.routes.js";
import roomRouter from "./routes/room.routes.js";
import matchRouter from "./routes/match.routes.js";
import submissionRouter from "./routes/submission.routes.js";
import scoreboardRouter from "./routes/scoreboard.routes.js";
import guildRouter from "./routes/guild.routes.js";
import leaderboardRouter from "./routes/leaderboard.routes.js";
import spectatorRouter from "./routes/spectator.routes.js";
import replayRouter from "./routes/replay.routes.js";
import passport from "./utils/passport.js";
import { ApiError } from "./utils/api-error.js";
import { sanitizeInput } from "./middlewares/sanitize.middleware.js";
import { initSocket } from "./socket/index.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.set("trust proxy", 1); // Trust first proxy (Production best practice)

// Middlewares
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
  })
);
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());
app.use(passport.initialize());

// Block NoSQL injection attempts on all routes
app.use(sanitizeInput);

import problemRouter from "./routes/problem.routes.js";

// Routes
app.use("/auth", authRouter);
app.use("/api/rooms", roomRouter);
app.use("/api/matches", matchRouter);
app.use("/api/submissions", submissionRouter);
app.use("/api/scoreboard", scoreboardRouter);
app.use("/api/guilds", guildRouter);
app.use("/api/leaderboard", leaderboardRouter);
app.use("/api/spectator", spectatorRouter);
app.use("/api/replay", replayRouter);
app.use("/api/problems", problemRouter);

// Basic health check
app.get("/", (req, res) => {
  res.json({ message: "API is running" });
});

// Centralized error handler
app.use((err, _req, res, _next) => {
  // Known operational errors thrown via ApiError
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      statusCode: err.statusCode,
      message: err.message,
      errors: err.errors,
    });
  }

  // Unknown / unexpected errors — don't leak details in production
  console.error(err);
  return res.status(500).json({
    success: false,
    statusCode: 500,
    message: "Internal Server Error",
    errors: [],
  });
});

connectDb()
  .then(async () => {
    const server = createServer(app);
    const io = initSocket(server);
    app.set("io", io);

    server.listen(PORT, () => {
      console.log(`Server is running at port : ${PORT}`);
    });
  })
  .catch((err) => {
    console.log("MONGO db connection failed !!! ", err);
  });
