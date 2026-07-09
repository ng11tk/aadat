import { Router } from "express";
import { paymentCreate, verifyPayment } from "./controllers.js";
import { validateWebhookSignature } from "razorpay/dist/utils/razorpay-utils.js";

const publicPaymentRouter = Router();
const privatePaymentRouter = Router();

privatePaymentRouter.post("/create", paymentCreate);
publicPaymentRouter.post("/webhook", verifyPayment);

export { publicPaymentRouter, privatePaymentRouter };
