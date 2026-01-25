import { Router } from "express";
import { createOpening } from "./controllers.js";

const openingPublicRouter = Router();
const openingPrivateRouter = Router();

// Use opening routes here
openingPrivateRouter.post("/create", createOpening);

// Export the main openingRouter
export { openingPublicRouter, openingPrivateRouter };
