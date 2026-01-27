import { Router } from "express";
import { buyerTransaction, createBuyer } from "./controllers.js";

const publicBuyerRouter = Router();
const privateBuyerRouter = Router();

// Public Buyer Routes
privateBuyerRouter.post("/buyer", createBuyer);
privateBuyerRouter.post("/buyer/transactions", buyerTransaction);

export { publicBuyerRouter, privateBuyerRouter };
