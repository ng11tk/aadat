import { Router } from "express";
import { createSalesOrder } from "./controllers.js";

const publicSalesRouter = Router();
const privateSalesRouter = Router();

// Public sales routes can be added here

// Private sales routes
privateSalesRouter.post("/orders", createSalesOrder);

export { publicSalesRouter, privateSalesRouter };
