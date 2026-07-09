import { Router } from "express";
import { paymentCreate } from "./controllers.js";

const publicPaymentRouter = Router();
const privatePaymentRouter = Router();

publicPaymentRouter.post("/create", paymentCreate);

export { publicPaymentRouter, privatePaymentRouter };
