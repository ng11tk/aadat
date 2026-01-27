import { Router } from "express";
import { createSupplier, supplierTransactions } from "./controllers.js";

const publicSupplierRouter = Router();
const privateSupplierRouter = Router();

// routers for supplier
privateSupplierRouter.post("/supplier", createSupplier);
privateSupplierRouter.post("/supplier/transactions", supplierTransactions);

export { publicSupplierRouter, privateSupplierRouter };
