import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000/server/api/auth", // match backend
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      try {
        // attempt refresh
        console.log("refresh token attempt.");

        await api.post("/refresh", {});
        // retry original request
        return api(error.config);
      } catch (err) {
        console.error("🚀 ~ err:", err);
        window.location.href = "/login"; // force login
      }
    }
    return Promise.reject(error);
  }
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
