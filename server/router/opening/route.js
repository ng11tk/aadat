import { Router } from "express";
import {
  unloadingPrivateRouter,
  unloadingPublicRouter,
} from "./unloading/index.js";

const openingPublicRouter = Router();
const openingPrivateRouter = Router();

// Use opening routes here
openingPrivateRouter.use("/unloading", unloadingPrivateRouter);
openingPublicRouter.use("/unloading", unloadingPublicRouter);

// Export the main openingRouter
export { openingPublicRouter, openingPrivateRouter };
