import axios from "axios";

// Separate axios instance for non-auth API endpoints
const roomAPI = axios.create({
  baseURL: import.meta.env.VITE_ROOM_API_URL || "http://localhost:5000/api",
  withCredentials: true,
});

export default roomAPI;
