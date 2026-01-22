import { Router } from "express";
import { check, login, logout, signup, refreshToken } from "./controllers.js";

const authRouter = Router();

//* Define authentication routes
authRouter.post("/signup", signup);
authRouter.post("/login", login);
authRouter.post("/check", check);
authRouter.post("/logout", logout);
authRouter.post("/refresh", refreshToken);

// Export the authRouter
export { authRouter };
