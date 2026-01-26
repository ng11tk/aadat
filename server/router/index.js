import { Router } from "express";
import { authRouter } from "./auth/route.js";
import protectedRoute from "../middleware/protectedRoute.js";
import { openingPublicRouter, openingPrivateRouter } from "./opening/index.js";
import { publicSalesRouter, privateSalesRouter } from "./sales/index.js";

const serverPublicRouter = Router();
const serverPrivateRouter = Router();

// Apply protectedRoute middleware to all private routes
serverPrivateRouter.use(protectedRoute);

// Use the authentication routes
serverPublicRouter.use("/auth", authRouter);

// opening routes
serverPublicRouter.use("/api/v1/opening", openingPublicRouter);
serverPrivateRouter.use("/api/v1/opening", openingPrivateRouter);

// sales routes
serverPublicRouter.use("/api/v1/sales", publicSalesRouter);
serverPrivateRouter.use("/api/v1/sales", privateSalesRouter);

// Export the main serverRouter
export { serverPublicRouter, serverPrivateRouter };
