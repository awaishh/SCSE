import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { SocketProvider } from "./context/SocketContext";
import { RoomProvider } from "./context/RoomContext";
import { GuildProvider } from "./context/GuildContext";
import { Toaster } from "react-hot-toast";
import ProtectedRoute from "./routes/ProtectedRoute";
import GuestRoute from "./routes/GuestRoute";

// Auth pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import VerifyReset from "./pages/VerifyReset";
import ResetPassword from "./pages/ResetPassword";

// Protected pages
import Dashboard from "./pages/Dashboard";
import Setup2FA from "./pages/Setup2FA";
import Lobby from "./pages/Lobby";
import Room from "./pages/Room";
import Match from "./pages/Match";
import Replay from "./pages/Replay";
import MatchHistory from "./pages/MatchHistory";
import JoinViaQR from "./pages/JoinViaQR";
import Guild from "./pages/Guild";
import JoinGuildViaLink from "./pages/JoinGuildViaLink";
import Leaderboard from "./pages/Leaderboard";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <RoomProvider>
            <GuildProvider>
              <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
              <Routes>

                {/* ── Guest only ── */}
                <Route element={<GuestRoute />}>
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/verify-reset" element={<VerifyReset />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                </Route>

                {/* ── Protected ── */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/setup-2fa" element={<Setup2FA />} />
                  <Route path="/lobby" element={<Lobby />} />
                  <Route path="/room/:roomCode" element={<Room />} />
                  <Route path="/match/:matchId" element={<Match />} />
                  <Route path="/replay/:matchId" element={<Replay />} />
                  <Route path="/match-history" element={<MatchHistory />} />
                  <Route path="/join/:roomCode" element={<JoinViaQR />} />
                  <Route path="/guild" element={<Guild />} />
                  <Route path="/guild/join/:guildId" element={<JoinGuildViaLink />} />
                  <Route path="/leaderboard" element={<Leaderboard />} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </GuildProvider>
          </RoomProvider>
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
