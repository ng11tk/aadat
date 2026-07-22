import { Router } from "express";
import {
  createUnloading,
  updateUnloading,
  openingBalance,
} from "./controllers.js";

const openingPublicRouter = Router();
const openingPrivateRouter = Router();

// Use opening routes here
openingPrivateRouter.post("/unloading", createUnloading);
openingPrivateRouter.put("/unloading/:id", updateUnloading);
openingPrivateRouter.post("/opening-balance", openingBalance);

// Export the main openingRouter
export { openingPublicRouter, openingPrivateRouter };
