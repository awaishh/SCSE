import axios from "axios";

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/auth",
  withCredentials: true,
});

// URLs that should NEVER trigger the refresh retry logic
const SKIP_REFRESH_URLS = ["/refresh", "/login", "/me", "/register"];

API.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const shouldSkip = SKIP_REFRESH_URLS.some((url) =>
      originalRequest.url?.includes(url)
    );

    // Only attempt refresh for 401s on non-auth endpoints, and only once
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !shouldSkip
    ) {
      originalRequest._retry = true;

      try {
        await axios.post(
          "http://localhost:5000/auth/refresh",
          {},
          { withCredentials: true }
        );
        // Retry the original request with the new cookie
        return API(originalRequest);
      } catch {
        // Refresh failed — just reject, let the component/context handle it
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default API;
