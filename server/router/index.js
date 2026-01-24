import { Router } from "express";
import { authRouter } from "./auth/route.js";
import protectedRoute from "../middleware/protectedRoute.js";

const serverPublicRouter = Router();
const serverPrivateRouter = Router();

serverPrivateRouter.use(protectedRoute);

// Use the authentication routes
serverPublicRouter.use("/auth", authRouter);
// serverPublicRouter.use("/auth", authPublicRouter);

// Export the main serverRouter
export { serverPublicRouter, serverPrivateRouter };
