import { Router } from "express";
import { createOrder, createSalesOrder, createOrders } from "./controllers.js";

const publicSalesRouter = Router();
const privateSalesRouter = Router();
const privateSalesRouter_v2 = Router();

// Public sales routes can be added here

// Private sales routes
privateSalesRouter.post("/orders", createSalesOrder);
privateSalesRouter_v2.post("/orders", createOrder);
privateSalesRouter_v2.post("/orders/bulk", createOrders);

export { publicSalesRouter, privateSalesRouter, privateSalesRouter_v2 };
