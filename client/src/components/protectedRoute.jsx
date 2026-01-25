import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import api from "../lib/axios.js";

const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await api.post("/auth/check");
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
