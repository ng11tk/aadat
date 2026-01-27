import { Router } from "express";
import { expenseTransactions, insertExpense } from "./controllers.js";

const publicExpenseRouter = Router();
const privateExpenseRouter = Router();

// Define private expense routes
privateExpenseRouter.post("/expense/bill", insertExpense);
privateExpenseRouter.post("/expense/transactions", expenseTransactions);

// Export the expense routers
export { publicExpenseRouter, privateExpenseRouter };
