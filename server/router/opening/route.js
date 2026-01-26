import { Router } from "express";
import { createUnloading, updateUnloading } from "./controllers.js";

const openingPublicRouter = Router();
const openingPrivateRouter = Router();

// Use opening routes here
openingPrivateRouter.post("/unloading", createUnloading);
openingPrivateRouter.put("/unloading/:id", updateUnloading);

// Export the main openingRouter
export { openingPublicRouter, openingPrivateRouter };
