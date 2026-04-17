# Requirements Document

## Introduction

A real-time multiplayer coding battle platform built on Node.js, Express, MongoDB, and Socket.IO. The platform delivers a competitive, battle-royale-inspired coding experience with multiple game modes, live match state management, a guild/community system, leaderboards, spectator mode, and a replay system. The backend follows a clean controller-service-model architecture and is designed to be built feature-by-feature.

The existing codebase already has a partial authentication system (JWT, bcrypt, Google/GitHub OAuth). Requirements below cover the full platform including auth completion and all new systems.

---

## Glossary

- **System**: The Multiplayer Coding Battle Platform backend
- **Auth_Service**: The module responsible for user registration, login, token management, and OAuth
- **Room_Service**: The module responsible for creating, joining, and managing match rooms
- **Match_Service**: The module responsible for match lifecycle, state transitions, and winner resolution
- **Player_State_Service**: The module responsible for tracking per-player in-match state
- **Submission_Service**: The module responsible for receiving, storing, and evaluating code submissions
- **Judge_Service**: The stub/simulated code evaluation engine
- **Scoreboard_Service**: The module responsible for computing and broadcasting live rankings
- **Socket_Service**: The Socket.IO layer responsible for all real-time event emission and handling
- **Guild_Service**: The module responsible for guild creation, membership, and guild battles
- **Leaderboard_Service**: The module responsible for global and mode-specific ranking computation
- **Spectator_Service**: The module responsible for allowing non-participants to observe live matches
- **Replay_Service**: The module responsible for storing and retrieving match timelines
- **User**: A registered account on the platform
- **Room**: A pre-match lobby that holds players before a match starts
- **Match**: An active or completed coding contest session
- **PlayerState**: The per-player record within a match tracking score, stage, attempts, and alive status
- **Submission**: A single code submission made by a player during a match
- **Guild**: A named group of users who compete together and appear on guild leaderboards
- **Replay**: A stored timeline of all events, submissions, and verdicts from a completed match
- **Stage**: A difficulty level within a match (1100, 1200, 1300, 1400, 1500+)
- **Verdict**: The result of a code submission evaluation (Accepted, Wrong Answer, Time Limit Exceeded, etc.)
- **Rank_Tier**: A named competitive tier assigned to a user based on rating (e.g., Bronze, Silver, Gold, Platinum, Diamond)
- **JWT**: JSON Web Token used for stateless authentication
- **Access_Token**: A short-lived JWT used to authenticate API requests
- **Refresh_Token**: A long-lived JWT used to obtain new Access_Tokens
- **Host**: The User who created a Room and controls match start

---

## Requirements

### Requirement 1: User Registration and Login

**User Story:** As a new user, I want to register and log in with email/password, so that I can access the platform and participate in matches.

#### Acceptance Criteria

1. WHEN a registration request is received with a valid name, email, and password, THE Auth_Service SHALL create a new User record with the password stored as a bcrypt hash and return a 201 response excluding the password and refreshToken fields.
2. WHEN a registration request is received with an email that already exists, THE Auth_Service SHALL return a 409 error response.
3. WHEN a registration request is received with any required field missing or empty, THE Auth_Service SHALL return a 400 error response.
4. WHEN a login request is received with a valid email and correct password, THE Auth_Service SHALL generate an Access_Token (15-minute expiry) and a Refresh_Token (7-day expiry), store the Refresh_Token on the User record, set both as HttpOnly cookies, and return a 200 response with the token pair.
5. WHEN a login request is received with an email that does not exist, THE Auth_Service SHALL return a 404 error response.
6. WHEN a login request is received with an incorrect password, THE Auth_Service SHALL return a 401 error response.
7. WHEN a logout request is received from an authenticated User, THE Auth_Service SHALL unset the Refresh_Token on the User record and clear both auth cookies.
8. WHEN a token refresh request is received with a valid Refresh_Token, THE Auth_Service SHALL issue a new Access_Token and a new Refresh_Token and invalidate the previous Refresh_Token.
9. IF a token refresh request is received with an expired or already-used Refresh_Token, THEN THE Auth_Service SHALL return a 401 error response.

---

### Requirement 2: OAuth Authentication

**User Story:** As a user, I want to sign in with Google or GitHub, so that I can access the platform without managing a separate password.

#### Acceptance Criteria

1. WHEN a User completes Google OAuth flow, THE Auth_Service SHALL find or create a User record linked to the Google account, generate an Access_Token and Refresh_Token, and redirect to the configured CLIENT_URL with both tokens.
2. WHEN a User completes GitHub OAuth flow, THE Auth_Service SHALL find or create a User record linked to the GitHub account, generate an Access_Token and Refresh_Token, and redirect to the configured CLIENT_URL with both tokens.
3. WHEN an OAuth callback is received for an email that already exists under a different provider, THE Auth_Service SHALL link the OAuth identity to the existing User record rather than creating a duplicate.

---

### Requirement 3: Protected Route Middleware

**User Story:** As the platform, I want all sensitive endpoints to require authentication, so that only verified users can access game features.

#### Acceptance Criteria

1. WHEN a request arrives at a protected route without an Access_Token in the Authorization header or cookie, THE Auth_Service SHALL return a 401 error response.
2. WHEN a request arrives at a protected route with an expired Access_Token, THE Auth_Service SHALL return a 401 error response.
3. WHEN a request arrives at a protected route with a valid Access_Token, THE Auth_Service SHALL attach the decoded User identity to the request context and pass control to the next handler.

---

### Requirement 4: Room Management

**User Story:** As a player, I want to create and join rooms, so that I can gather with other players before a match starts.

#### Acceptance Criteria

1. WHEN an authenticated User sends a create-room request with a game mode, THE Room_Service SHALL create a Room record with status WAITING, assign the requesting User as Host, generate a unique room code, and return the Room details.
2. WHERE a Room is configured as private, THE Room_Service SHALL require a matching room code for any join request.
3. WHEN an authenticated User sends a join-room request with a valid room code and the Room status is WAITING, THE Room_Service SHALL add the User to the Room's player list and return updated Room details.
4. IF a join-room request is received for a Room that is not in WAITING status, THEN THE Room_Service SHALL return a 400 error response indicating the room is not accepting players.
5. IF a join-room request is received for a Room that has reached its maximum player capacity for the selected game mode, THEN THE Room_Service SHALL return a 400 error response.
6. WHEN a User leaves a Room while the Room status is WAITING, THE Room_Service SHALL remove the User from the player list.
7. WHEN the Host leaves a Room while the Room status is WAITING, THE Room_Service SHALL transfer Host status to the next player in the room or delete the Room if no players remain.
8. WHEN a Room is created, THE Socket_Service SHALL emit a room-created event to the creating User's socket.
9. WHEN a User joins or leaves a Room, THE Socket_Service SHALL emit a room-updated event to all sockets in the room.

---

### Requirement 5: Match Lifecycle

**User Story:** As a Host, I want to start and end matches, so that the game progresses through defined states.

#### Acceptance Criteria

1. THE Match_Service SHALL enforce the state machine: CREATED → WAITING → COUNTDOWN → LIVE → FINISHED, rejecting any transition that skips a state.
2. WHEN the Host sends a start-match request for a Room in WAITING status with at least the minimum required players for the game mode, THE Match_Service SHALL transition the Room to COUNTDOWN status, create a Match record, and initialize a PlayerState record for each player.
3. IF the Host sends a start-match request for a Room with fewer than the minimum required players, THEN THE Match_Service SHALL return a 400 error response.
4. WHILE a Match is in COUNTDOWN status, THE Match_Service SHALL wait 10 seconds and then transition the Match to LIVE status.
5. WHEN a Match transitions to LIVE status, THE Match_Service SHALL assign the first Stage (difficulty 1100) to all PlayerState records and record the match start timestamp.
6. WHEN all players in a Match have been eliminated or only one player (or one team in team modes) remains, THE Match_Service SHALL transition the Match to FINISHED status, record the end timestamp, and persist the final rankings.
7. WHEN a Match transitions to FINISHED status, THE Socket_Service SHALL emit a match-finished event to all sockets in the match room containing the final scoreboard.
8. WHEN a Match transitions to any state, THE Socket_Service SHALL emit a match-state-changed event to all sockets in the match room.

---

### Requirement 6: Game Modes

**User Story:** As a player, I want to choose from multiple game modes, so that I can compete in the format that suits me.

#### Acceptance Criteria

1. THE Room_Service SHALL support the following game modes: Battle Royale (2–8 players), Blitz 1v1, Blitz 3v3, Team Duel 2v2, Team Duel 3v3, ICPC Style 3v3, and Knockout Tournament.
2. WHEN a Room is created with a team-based mode (Team Duel or ICPC Style), THE Room_Service SHALL accept a team assignment for each player and store it on the PlayerState record.
3. WHEN a Room is created with Knockout Tournament mode, THE Match_Service SHALL generate a bracket structure and store it on the Match record before transitioning to WAITING status.
4. WHILE a Match is in LIVE status under ICPC Style mode, THE Scoreboard_Service SHALL compute rankings using penalty-based scoring: rank by problems solved descending, then by total penalty time ascending, where penalty time equals submission time in minutes plus 20 minutes per wrong attempt on accepted problems.
5. WHILE a Match is in LIVE status under Battle Royale mode, THE Player_State_Service SHALL track each player's alive status and eliminate players according to the elimination rules defined in Requirement 8.
6. WHILE a Match is in LIVE status under Blitz mode, THE Match_Service SHALL enforce a match duration of 15 minutes and transition to FINISHED status when the timer expires.
7. WHILE a Match is in LIVE status under Knockout Tournament mode, THE Match_Service SHALL advance winners to the next bracket round and eliminate losers.

---

### Requirement 7: Difficulty Progression System

**User Story:** As a player in a match, I want to progress through difficulty stages by solving problems, so that the match escalates in challenge over time.

#### Acceptance Criteria

1. THE Match_Service SHALL define five difficulty stages with ratings: Stage 1 (1100), Stage 2 (1200), Stage 3 (1300), Stage 4 (1400), Stage 5 (1500+).
2. WHEN a player's Submission receives an Accepted verdict for the current Stage problem, THE Player_State_Service SHALL increment the player's stage by one and record the stage-unlock timestamp.
3. WHILE a player is on Stage 5 (1500+), THE Player_State_Service SHALL continue accumulating score for additional accepted submissions without advancing to a higher stage.
4. THE Player_State_Service SHALL track the current stage, score, wrong attempt count, and last active timestamp for each player.

---

### Requirement 8: Player Elimination

**User Story:** As a match participant, I want players to be eliminated for inactivity or excessive wrong attempts, so that the match remains competitive and time-bounded.

#### Acceptance Criteria

1. WHILE a Match is in LIVE status under Battle Royale mode, IF a player has not made any Submission within 10 minutes of the match start or their last Submission, THEN THE Player_State_Service SHALL mark the player as eliminated with reason INACTIVITY.
2. WHILE a Match is in LIVE status under Battle Royale mode, IF a player accumulates 5 or more wrong attempts on the current Stage, THEN THE Player_State_Service SHALL mark the player as eliminated with reason WRONG_ATTEMPTS.
3. WHEN a player is eliminated, THE Socket_Service SHALL emit a player-eliminated event to all sockets in the match room containing the eliminated player's ID and elimination reason.
4. WHEN a player is eliminated, THE Scoreboard_Service SHALL update the live scoreboard to reflect the player's eliminated status.
5. WHILE a Match is in LIVE status under team-based modes, THE Player_State_Service SHALL eliminate an entire team when all members of that team have been individually eliminated.

---

### Requirement 9: Submission System

**User Story:** As a player, I want to submit code during a match, so that my solution can be evaluated and my progress updated.

#### Acceptance Criteria

1. WHEN an authenticated player in a LIVE Match sends a submission request with a problem ID, language, and source code, THE Submission_Service SHALL create a Submission record with status PENDING and return a 202 response with the submission ID.
2. WHEN a Submission record is created, THE Submission_Service SHALL pass the submission to the Judge_Service for evaluation.
3. WHEN the Judge_Service returns a verdict, THE Submission_Service SHALL update the Submission record with the verdict and timestamp.
4. WHEN a Submission receives an Accepted verdict, THE Submission_Service SHALL notify the Player_State_Service to advance the player's stage.
5. WHEN a Submission receives a non-Accepted verdict, THE Submission_Service SHALL increment the player's wrong attempt count on the current Stage.
6. THE Submission_Service SHALL store all Submission records regardless of verdict for replay and audit purposes.
7. IF a submission request is received from a player whose PlayerState is marked as eliminated, THEN THE Submission_Service SHALL return a 403 error response.
8. WHEN a Submission verdict is determined, THE Socket_Service SHALL emit a submission-result event to the submitting player's socket containing the verdict and updated PlayerState.

---

### Requirement 10: Judge System (Stub/Simulated)

**User Story:** As the platform, I want a simulated judge that evaluates submissions, so that the system can function end-to-end before a real judge is integrated.

#### Acceptance Criteria

1. THE Judge_Service SHALL expose an internal evaluate function that accepts a problem ID, language, and source code and returns a verdict.
2. THE Judge_Service SHALL return one of the following verdicts: Accepted, Wrong_Answer, Time_Limit_Exceeded, Runtime_Error, or Compilation_Error.
3. WHILE operating in stub mode, THE Judge_Service SHALL simulate evaluation by returning a configurable verdict (defaulting to Accepted) with a simulated latency between 500ms and 2000ms.
4. THE Judge_Service SHALL be designed so that the stub implementation can be replaced with a real judge integration without changing the Submission_Service interface.

---

### Requirement 11: Live Scoreboard

**User Story:** As a match participant or spectator, I want to see a live scoreboard, so that I can track rankings and progress in real time.

#### Acceptance Criteria

1. WHEN a Match is in LIVE status, THE Scoreboard_Service SHALL maintain a ranked list of all players sorted by stage descending, then score descending, then wrong attempt count ascending.
2. WHEN any PlayerState changes (stage advance, wrong attempt, elimination), THE Scoreboard_Service SHALL recompute the rankings and emit a scoreboard-updated event via the Socket_Service to all sockets in the match room.
3. WHEN a scoreboard-updated event is emitted, THE Socket_Service SHALL include each player's username, current stage, score, wrong attempt count, and alive status.
4. WHEN a GET scoreboard request is received for a LIVE or FINISHED Match, THE Scoreboard_Service SHALL return the current ranked list via HTTP.

---

### Requirement 12: Real-Time Socket Events

**User Story:** As a player or spectator, I want all game events delivered in real time, so that the experience feels live and responsive.

#### Acceptance Criteria

1. THE Socket_Service SHALL use Socket.IO and require a valid Access_Token in the handshake auth object; connections without a valid token SHALL be rejected.
2. WHEN a User connects with a valid token, THE Socket_Service SHALL join the socket to a room channel identified by the room ID.
3. THE Socket_Service SHALL emit the following events: room-created, room-updated, match-state-changed, match-finished, player-eliminated, submission-result, scoreboard-updated, spectator-joined, replay-ready.
4. WHEN the Socket_Service emits an event, THE Socket_Service SHALL include a timestamp and event type in every emitted payload.
5. IF a socket disconnects during a LIVE Match, THEN THE Socket_Service SHALL emit a player-disconnected event to the match room and THE Player_State_Service SHALL start a 60-second reconnection grace period before treating the disconnection as inactivity.

---

### Requirement 13: Guild System

**User Story:** As a user, I want to create or join a guild, so that I can compete as part of a team community.

#### Acceptance Criteria

1. WHEN an authenticated User sends a create-guild request with a unique guild name and optional description, THE Guild_Service SHALL create a Guild record, assign the User as guild owner, and return the Guild details.
2. IF a create-guild request is received with a guild name that already exists, THEN THE Guild_Service SHALL return a 409 error response.
3. WHEN an authenticated User sends a join-guild request with a valid guild ID, THE Guild_Service SHALL add the User to the guild's member list if the guild has not reached its maximum capacity of 50 members.
4. IF a join-guild request is received for a guild that has reached 50 members, THEN THE Guild_Service SHALL return a 400 error response.
5. WHEN a guild member leaves a guild, THE Guild_Service SHALL remove the member from the guild's member list.
6. WHEN the guild owner leaves a guild, THE Guild_Service SHALL transfer ownership to the longest-standing member or delete the guild if no members remain.
7. THE Guild_Service SHALL maintain a guild rating computed as the average rating of all guild members.
8. WHEN a GET guild-leaderboard request is received, THE Guild_Service SHALL return guilds sorted by guild rating descending.

---

### Requirement 14: Global and Mode-Wise Leaderboards

**User Story:** As a competitive player, I want to see global and per-mode leaderboards with rank tiers, so that I can measure my standing against other players.

#### Acceptance Criteria

1. THE Leaderboard_Service SHALL maintain a global leaderboard ranking all Users by their rating score descending.
2. THE Leaderboard_Service SHALL maintain separate leaderboards for each game mode: Battle Royale, Blitz, Team Duel, ICPC Style, and Knockout Tournament.
3. WHEN a Match transitions to FINISHED status, THE Leaderboard_Service SHALL update the ratings of all participating Users based on their final ranking using an Elo-inspired delta: winner gains points, loser loses points, scaled by rank difference.
4. THE Leaderboard_Service SHALL assign a Rank_Tier to each User based on their rating: Bronze (0–999), Silver (1000–1499), Gold (1500–1999), Platinum (2000–2499), Diamond (2500+).
5. WHEN a GET leaderboard request is received with an optional mode parameter, THE Leaderboard_Service SHALL return a paginated list of up to 50 users per page including username, rating, Rank_Tier, and match count.

---

### Requirement 15: Spectator Mode

**User Story:** As a user, I want to watch live matches without participating, so that I can learn from other players and enjoy the competition.

#### Acceptance Criteria

1. WHEN an authenticated User sends a spectate-match request for a LIVE Match, THE Spectator_Service SHALL add the User to the match's spectator list and join the User's socket to the match room channel.
2. WHEN a spectator joins a match, THE Socket_Service SHALL emit a spectator-joined event to all sockets in the match room.
3. WHILE a User is spectating a LIVE Match, THE Spectator_Service SHALL deliver all scoreboard-updated, player-eliminated, and submission-result events to the spectator's socket in real time.
4. WHEN a spectator leaves or disconnects, THE Spectator_Service SHALL remove the User from the spectator list without affecting the match state.
5. IF a spectate-match request is received for a Match that is not in LIVE status, THEN THE Spectator_Service SHALL return a 400 error response.

---

### Requirement 16: Replay System

**User Story:** As a player or spectator, I want to review completed matches, so that I can analyze strategies and learn from past games.

#### Acceptance Criteria

1. WHILE a Match is in LIVE status, THE Replay_Service SHALL record every game event (stage advances, submissions, verdicts, eliminations, scoreboard snapshots) with a relative timestamp offset from match start.
2. WHEN a Match transitions to FINISHED status, THE Replay_Service SHALL finalize the Replay record and mark it as available.
3. WHEN a GET replay request is received for a completed Match, THE Replay_Service SHALL return the full ordered event timeline including player actions, verdicts, and scoreboard snapshots.
4. THE Replay_Service SHALL store Replay records in MongoDB with a TTL index of 30 days, after which records are automatically deleted.
5. WHEN a Replay record is finalized, THE Socket_Service SHALL emit a replay-ready event to all sockets that were in the match room.

---

### Requirement 17: Rate Limiting and Input Validation

**User Story:** As the platform, I want to protect all endpoints from abuse and malformed input, so that the system remains stable and secure.

#### Acceptance Criteria

1. THE System SHALL apply rate limiting to all authentication endpoints: maximum 10 requests per IP per 15-minute window; requests exceeding this limit SHALL receive a 429 response.
2. THE System SHALL apply rate limiting to submission endpoints: maximum 20 submissions per User per minute; requests exceeding this limit SHALL receive a 429 response.
3. WHEN any API request is received, THE System SHALL validate all required fields using express-validator before passing the request to the controller; invalid requests SHALL receive a 422 response with a list of validation errors.
4. THE System SHALL sanitize all string inputs to prevent NoSQL injection by rejecting inputs that contain MongoDB operator keys (e.g., `$where`, `$gt`).

---

### Requirement 18: Error Handling and Logging

**User Story:** As a developer, I want consistent error responses and server-side logging, so that I can debug issues quickly.

#### Acceptance Criteria

1. THE System SHALL use a centralized error-handling middleware that catches all unhandled errors and returns a JSON response with a status code, error message, and request ID.
2. WHEN an unhandled error occurs, THE System SHALL log the error stack trace, request method, request path, and timestamp to the server console.
3. THE System SHALL return error responses in a consistent shape: `{ success: false, statusCode: number, message: string, errors: array }`.
4. THE System SHALL return success responses in a consistent shape: `{ success: true, statusCode: number, message: string, data: object }`.

---

### Requirement 19: Database Models

**User Story:** As a developer, I want well-defined Mongoose schemas for all entities, so that data is consistently structured and queryable.

#### Acceptance Criteria

1. THE System SHALL define a User model with fields: name, email, password (hashed), googleId, githubId, avatar, refreshToken, rating (default 1000), guildId, matchCount, and timestamps.
2. THE System SHALL define a Room model with fields: roomCode (unique), hostId, gameMode, status (WAITING/COUNTDOWN/LIVE/FINISHED), players (array of User refs), maxPlayers, isPrivate, and timestamps.
3. THE System SHALL define a Match model with fields: roomId, gameMode, status, players (array of User refs), winnerIds, startTime, endTime, bracketData (for tournament mode), and timestamps.
4. THE System SHALL define a PlayerState model with fields: matchId, userId, teamId, currentStage, score, wrongAttempts, isAlive, eliminationReason, lastActiveAt, stageHistory (array of stage unlock timestamps), and timestamps.
5. THE System SHALL define a Submission model with fields: matchId, userId, problemId, language, sourceCode, verdict, submittedAt, evaluatedAt, and timestamps.
6. THE System SHALL define a Guild model with fields: name (unique), description, ownerId, members (array of User refs), guildRating, maxMembers (50), and timestamps.
7. THE System SHALL define a Replay model with fields: matchId, events (array of timestamped event objects), finalScoreboard, createdAt, and a TTL index of 30 days on createdAt.
8. THE System SHALL define a Leaderboard model with fields: userId, mode, rating, rankTier, wins, losses, matchCount, and timestamps.

---

### Requirement 20: Project Architecture

**User Story:** As a developer, I want a clean, modular folder structure, so that the codebase is easy to navigate and extend feature-by-feature.

#### Acceptance Criteria

1. THE System SHALL organize source code into the following top-level directories under `src/`: controllers, services, models, routes, middlewares, socket, utils, and validators.
2. THE System SHALL implement each backend feature (auth, room, match, player-state, submission, judge, scoreboard, socket, guild, leaderboard, spectator, replay) as a separate module with its own controller, service, route, and validator files.
3. THE System SHALL use ES module syntax (`import`/`export`) consistently across all source files.
4. THE System SHALL load all environment variables from a `.env` file via `dotenv` and the application SHALL fail to start with a descriptive error if any required environment variable is missing.
