import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import api from "../lib/axios.js";
import { promiseResolver } from "../utils/promisResolver.js";

const ProtectedRoute = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      const [response, error] = await promiseResolver(
        api.post("/auth/check", {}),
      );

      if (error) {
        throw error;
        setIsAuthenticated(false);
      }
      setIsAuthenticated(true);
    };
    checkAuth();
  }, []);

  if (isAuthenticated === null) {
    return <div>Loading...</div>; // show loader while checking
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
