import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { Toaster } from "react-hot-toast";
import ProtectedRoute from "./routes/ProtectedRoute";
import GuestRoute from "./routes/GuestRoute";

// Pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import Setup2FA from "./pages/Setup2FA";
import ForgotPassword from "./pages/ForgotPassword";
import VerifyReset from "./pages/VerifyReset";
import ResetPassword from "./pages/ResetPassword";

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster position="top-right" />
        <Routes>
          {/* Public Routes (Only for Guests) */}
          <Route element={<GuestRoute />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/verify-reset" element={<VerifyReset />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Route>
          
          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/setup-2fa" element={<Setup2FA />} />
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
          </Route>
          
          {/* 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
