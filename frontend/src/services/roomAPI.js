import axios from "axios";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/auth";
const ROOM_API_BASE = import.meta.env.VITE_ROOM_API_URL || "http://localhost:5000/api";

// Separate axios instance for non-auth API endpoints (rooms, matches, guilds, etc.)
const roomAPI = axios.create({
  baseURL: ROOM_API_BASE,
  withCredentials: true,
});

// Mirror the same 401 → refresh retry logic that api.js uses
roomAPI.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry
    ) {
      originalRequest._retry = true;

      try {
        // Hit the auth refresh endpoint to get a new accessToken cookie
        await axios.post(
          `${API_BASE}/refresh`,
          {},
          { withCredentials: true }
        );
        // Retry the original request with the new cookie
        return roomAPI(originalRequest);
      } catch {
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default roomAPI;
