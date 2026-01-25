import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

/**
 * Middleware to protect routes that require authentication
 * Verifies JWT token from cookies and attaches user to request
 */

const protectedRoute = async (req, res, next) => {
  try {
    // Get token from cookies
    const token = req.cookies.accessToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_TOKEN_SECRET_KEY);
    // this verify both user existence and token validity
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: "Invalid token.",
      });
    }

    // Find user by id from token
    const user = decoded;
    // Attach user to request object
    req.user = user;

    // Proceed to next middleware or route handler
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        success: false,
        message: "Invalid token.",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message: "Token expired. Please login again.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Authentication failed.",
      error: error.message,
    });
  }
};

export default protectedRoute;
