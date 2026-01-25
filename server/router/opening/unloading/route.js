import { Router } from "express";
import { createUnloading } from "./controllers.js";

const unloadingPublicRouter = Router();
const unloadingPrivateRouter = Router();

// Use unloading routes here
unloadingPrivateRouter.post("/create", createUnloading);

// Export the main unloadingRouter
export { unloadingPublicRouter, unloadingPrivateRouter };
