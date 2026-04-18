# KryptCode

KryptCode is an advanced, real-time multiplayer competitive programming platform designed for developers to challenge each other in live coding duels. Built entirely on the MERN stack and heavily augmented with WebSockets, KryptCode creates a seamless, low-latency environment for competitive algorithm solving, team battles, and live spectating.

## Architecture

This project is divided into two main components:
*   **Backend:** Node.js and Express RESTful API coupled with a robust Socket.io server to handle real-time synchronization, match state orchestration, code execution routing, and matchmaking.
*   **Frontend:** A React Single Page Application utilizing Vite, Tailwind CSS, and the Monaco Code Editor. The client interfaces with the backend over both standard HTTP REST and continuous WebSocket connections to ensure interface reactivity without polling.

## Core Features

### Real-Time Multiplayer Coding Arenas
*   **Blitz 1v1:** Instantaneous matchmaking queue that pairs two developers. Once paired, the server provisions a room and automatically subjects players to a 3-question programming gauntlet.
*   **Team Modes:** Support for 2v2 and 3v3 team-based algorithmic duels.
*   **Private Rooms:** Users can generate unique 6-character access codes to host private lobbies for specialized training or private battles.

### Advanced Code Execution Engine
KryptCode evaluates arbitrary user code submissions securely in real-time.
*   **Primary Engine:** Integrated with the Judge0 Compiler API for robust, multi-language execution (JavaScript, Python, C++, Java, C).
*   **Static Fallback Simulation:** Designed with an isolated Regex-based simulation layer that acts as a failsafe when the primary execution engine is rate-limited, allowing fundamental algorithm validation offline.

### Spectator and Replay System
*   **Live Spectator Mode:** Third-party users can join active matches as invisible spectators. The platform syncs the active player's code editor state in real-time, allowing viewers to see keystrokes and submissions live.
*   **Time-Series Match Replay:** The backend continuously logs keystroke deltas and evaluation events into a MongoDB time-series index. Post-match, users can interact with a "video-like" playback engine that graphically reconstructs the entire coding session from database artifacts.

### Anti-Cheat Mechanisms
*   **Focus Monitoring:** Browser API configurations actively monitor `visibilitychange` and `blur` events, issuing strict warnings when players attempt to tab-switch or abandon the active editor context during live matches.
*   **Enforced Constraints:** Real-time socket enforcement synchronizes round timers across clients, forcibly advancing slower participants to prevent deliberate stalemates.

## Tech Stack Overview

*   **Frontend:** React, React Router, Tailwind CSS, GSAP (Animations), Socket.io-client, Monaco Editor.
*   **Backend:** Node.js, Express.js, Socket.io, Mongoose.
*   **Database:** MongoDB.
*   **Code Execution:** Judge0 CE (Public API), Internal V8/Regex Evaluators.

## Local Setup and Installation


### Backend Configuration
1. Navigate to the backend directory.
2. Install dependencies:
   ```bash
   cd backend
   npm install
   ```
3. Create a `.env` file referencing the `.env.example` structure. Ensure the following keys are populated:
   ```env
   PORT=5000
   MONGODB_URI=<your-mongodb-connection-string>
   JWT_SECRET=<your-auth-secret>
   CLIENT_URL=http://localhost:5173
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

### Frontend Configuration
1. Navigate to the frontend directory.
2. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```

## Team Members
* Awaish Ehsan
* Shubham Pandey
* Swayam Agarwal
* Rishav Kashyap
