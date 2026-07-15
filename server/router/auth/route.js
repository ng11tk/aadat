import { Router } from "express";
import { check, login, logout, signup, refreshToken } from "./controllers.js";
import {
  loginLimiter,
  privateApiLimiter,
  publicApiLimiter,
  signupLimiter,
} from "../../middleware/rateLimiter.js";
import protectedRoute from "../../middleware/protectedRoute.js";

const authRouter = Router();

//* Define authentication routes
authRouter.post("/signup", signupLimiter, signup);
authRouter.post("/login", loginLimiter, login);
authRouter.post("/check", protectedRoute, privateApiLimiter, check);
authRouter.post("/logout", protectedRoute, privateApiLimiter, logout);
authRouter.post("/refresh", publicApiLimiter, refreshToken);

// Export the authRouter
export { authRouter };
