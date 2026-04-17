import { createContext, useContext, useState, useEffect } from "react";
import API from "../services/api";
import toast from "react-hot-toast";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount: check if a valid session exists via /me
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const { data: apiResponse } = await API.get("/me");
      setUser(apiResponse.data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (credentials) => {
    try {
      const { data: apiResponse } = await API.post("/login", credentials);
      const result = apiResponse.data;
      // If backend returns requires2FA flag, don't set user yet
      if (result?.requires2FA) {
        return { requires2FA: true };
      }
      setUser(result.user);
      toast.success("Login successful!");
      return result;
    } catch (error) {
      toast.error(error.response?.data?.message || "Login failed");
      throw error;
    }
  };

  // Called after 2FA code is entered during login
  const verify2FALogin = async ({ email, password, code }) => {
    try {
      const { data: apiResponse } = await API.post("/login/2fa", { email, password, code });
      setUser(apiResponse.data.user);
      toast.success("Login successful!");
      return apiResponse.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid 2FA code");
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const { data: apiResponse } = await API.post("/register", userData);
      toast.success("Account created! Please sign in.");
      return apiResponse.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Registration failed");
      throw error;
    }
  };

  const logout = async () => {
    try {
      await API.post("/logout");
    } catch {
      // ignore
    } finally {
      setUser(null);
      toast.success("Logged out");
    }
  };

  const setup2FA = async () => {
    try {
      const { data: apiResponse } = await API.post("/setup-2fa");
      return apiResponse.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "2FA setup failed");
      throw error;
    }
  };

  const verify2FA = async (code) => {
    try {
      const { data: apiResponse } = await API.post("/verify-2fa", { code });
      setUser((prev) => ({ ...prev, isTwoFactorEnabled: true }));
      toast.success("2FA enabled successfully!");
      return apiResponse.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid code");
      throw error;
    }
  };

  const forgotPassword = async (email) => {
    try {
      const { data: apiResponse } = await API.post("/forgot-password", { email });
      toast.success("Check your authenticator app to continue");
      return apiResponse.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Request failed");
      throw error;
    }
  };

  const verifyResetCode = async (email, code) => {
    try {
      const { data: apiResponse } = await API.post("/verify-reset-code", { email, code });
      toast.success("Code verified!");
      return apiResponse.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Invalid code");
      throw error;
    }
  };

  const resetPassword = async (resetToken, newPassword) => {
    try {
      const { data: apiResponse } = await API.post("/reset-password", { resetToken, newPassword });
      toast.success("Password reset! Please sign in.");
      return apiResponse.data;
    } catch (error) {
      toast.error(error.response?.data?.message || "Reset failed");
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        verify2FALogin,
        register,
        logout,
        setup2FA,
        verify2FA,
        forgotPassword,
        verifyResetCode,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
