import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/auth",
  withCredentials: true, // Crucial for sending/receiving cookies
});

// Response Interceptor: Handle Refresh Token automatically
API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retrying
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Just call refresh. The backend will update both cookies.
        await axios.post(
          "http://localhost:5000/auth/refresh",
          {},
          { withCredentials: true }
        );

        // Retry the original request (now it will have the new accessToken cookie)
        return API(originalRequest);
      } catch (refreshError) {
        // Refresh token expired or invalid, logout user
        window.location.href = "/login";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default API;
