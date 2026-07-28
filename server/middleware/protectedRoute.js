import jwt from "jsonwebtoken";
// dotenv.config() should be called once in your app entry point (index.js),
// not here.

/**
 * Middleware to protect routes that require authentication.
 * Verifies the access token JWT from cookies and attaches the decoded
 * payload (id, email) to req.user.
 *
 * Note: this only proves the token is validly signed and unexpired — it
 * does NOT check that the user still exists or hasn't been banned/deleted.
 * That's an accepted tradeoff for stateless access tokens; it's why the
 * access token TTL should stay short (e.g. 15 min).
 */
const protectedRoute = async (req, res, next) => {
  try {
    const token = req.cookies.accessToken;

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Access denied. No token provided.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_ACCESS_TOKEN_SECRET_KEY);

    if (!decoded?.id) {
      return res.status(401).json({
        success: false,
        message: "Invalid token.",
      });
    }

    req.user = decoded; // { id, email } — keep this payload minimal at signing time

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

    console.error("Auth middleware error:", error);
    return res.status(500).json({
      success: false,
      message: "Authentication failed.",
    });
  }
};

export default protectedRoute;
