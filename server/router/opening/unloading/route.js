import { Router } from "express";
import { createUnloading, updateUnloadingStatus } from "./controllers.js";

const unloadingPublicRouter = Router();
const unloadingPrivateRouter = Router();

// Use unloading routes here
unloadingPrivateRouter.post("/create", createUnloading);
unloadingPrivateRouter.put("/update/:id", updateUnloadingStatus); // Placeholder for update route

// Export the main unloadingRouter
export { unloadingPublicRouter, unloadingPrivateRouter };
