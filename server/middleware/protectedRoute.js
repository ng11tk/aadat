import jwt from "jsonwebtoken";
import validate from "validator";
import { gqlClient } from "../lib/graphql.js";
import { promiseResolver } from "../utils/promisResolver.js";
import { GET_USER_BY_EMAIL } from "../graphql/query.js";

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

    // Find user by id from token
    // validate user data
    if (!validate.isEmail(decoded.email)) {
      return res.status(401).json({ message: "Email is not valid!" });
    }

    // check user in database
    const [{ users_user_by_pk: existingUser = {} }, existingUserError] =
      await promiseResolver(
        gqlClient.request(GET_USER_BY_EMAIL, { email: decoded.email }),
      );

    if (existingUserError || !existingUser) {
      console.error("Error checking existing user:", existingUserError);
      return res
        .status(401)
        .json({ message: "User not found. Invalid token." });
    }

    const user = existingUser;
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
