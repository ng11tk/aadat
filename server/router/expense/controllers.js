import {
  INSERT_EXPENSE_BILLS,
  INSERT_EXPENSE_TRANSACTIONS,
} from "../../graphql/mutation.js";
import { gqlClient } from "../../lib/graphql.js";
import { promiseResolver } from "../../utils/promisResolver.js";

const formatDate = (date) => date.toISOString().split("T")[0];

export const insertExpense = async (req, res) => {
  try {
    const today = new Date();
    const { newExpense } = req.body;

    if (!newExpense) {
      return res.status(400).json({ error: "Missing expense data" });
    }

    const insertObject = {
      expense_emp_id: newExpense.person || null,
      category: newExpense.category,
      advance: 0,
      amount: Number(newExpense.amount),
      remaining_amount: 0,
      payment_status: "partial",
      description: newExpense.description || null,
      bhada_details:
        newExpense.category === "Bhada"
          ? {
              vehicle: newExpense.vehicle,
              modi: newExpense.modi,
              item: newExpense.item,
            }
          : null,
      date: formatDate(today),
    };

    // Insert expense logic goes here
    const [data, err] = await promiseResolver(
      gqlClient.request(INSERT_EXPENSE_BILLS, {
        objects: [insertObject],
      }),
    );

    if (err) {
      console.error("Error inserting expense bill:", err);
      return res.status(500).json({ error: "Failed to insert expense bill" });
    }

    return res
      .status(201)
      .json({ message: "Expense created successfully" }, data);
  } catch (error) {
    console.error("Error in insertExpense:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const expenseTransactions = async (req, res) => {
  // Implementation for expense transactions
  try {
    const { selectedPayments } = req.body;

    if (!selectedPayments || Object.keys(selectedPayments).length === 0) {
      return res
        .status(400)
        .json({ error: "No transactions provided for insertion" });
    }

    const output = Object.entries(selectedPayments).map(([id, v]) => ({
      expense_bill_id: id,
      amount: v.amount || 0,
      date: formatDate(new Date()),
    }));

    if (output.length === 0) {
      return res.status(400).json({ error: "No valid transactions to insert" });
    }

    // transaction insertion logic goes here
    const [data, err] = await promiseResolver(
      gqlClient.request(INSERT_EXPENSE_TRANSACTIONS, {
        objects: output,
      }),
    );
    if (err) {
      console.error("Error inserting expense transactions:", err);
      return res
        .status(500)
        .json({ error: "Failed to insert expense transactions" });
    }

    // Placeholder response
    return res
      .status(200)
      .json({ message: "Expense transactions endpoint", data });
  } catch (error) {
    console.error("Error in expenseTransactions:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
