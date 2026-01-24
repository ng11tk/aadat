import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000/server/auth", // match backend
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
      !originalRequest.url?.includes("/refresh")
    ) {
      originalRequest._retry = true;
      try {
        // attempt refresh
        console.log("refresh token attempt.");
        await api.post("/refresh", {});
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

const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await api.post("/check");
        setIsAuthenticated(true);
      } catch (err) {
        console.error("🚀 ~ checkAuth ~ err:", err);
        setIsAuthenticated(false);
      }
    };
    checkAuth();
  }, []);

  if (isAuthenticated === null) {
    return <div>Loading...</div>; // show loader while checking
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
