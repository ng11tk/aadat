import { Router } from "express";
import { buyerTransaction, createBuyer } from "./controllers.js";

const publicBuyerRouter = Router();
const privateBuyerRouter = Router();

// Public Buyer Routes
privateBuyerRouter.post("/create", createBuyer);
privateBuyerRouter.post("/transaction", buyerTransaction);

export { publicBuyerRouter, privateBuyerRouter };
