import { Router } from "express";
import { check, login, logout, signup } from "./controllers.js";

const authRouter = Router();

//* Define authentication routes
authRouter.post("/signup", signup);
authRouter.post("/login", login);
authRouter.post("/check", check);
authRouter.post("/logout", logout);

// Export the authRouter
export { authRouter };
