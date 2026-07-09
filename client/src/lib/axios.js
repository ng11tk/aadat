import axios from "axios";
import { BASE_URL } from "../constants/api";

const api = axios.create({
  baseURL: BASE_URL, // match backend
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Don't retry if it's the refresh endpoint itself or already retried
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/auth/refresh")
    ) {
      originalRequest._retry = true;
      try {
        // attempt refresh
        console.log("refresh token attempt.");
        await api.post("/auth/refresh", {});
        // retry original request
        return api(originalRequest);
      } catch (err) {
        console.error("Refresh failed:", err);
        window.location.href = "/login"; // force login
      }
    }
    return Promise.reject(error);
  },
);

export default api;
