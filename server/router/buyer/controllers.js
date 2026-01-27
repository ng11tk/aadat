import {
  INSERT_BUYER,
  INSERT_BUYER_TRANSACTION,
} from "../../graphql/mutation.js";
import { gqlClient } from "../../lib/graphql.js";
import { promiseResolver } from "../../utils/promisResolver.js";

export const createBuyer = async (req, res) => {
  try {
    const { name, phone } = req.body;
    // Logic to create a buyer in the database
    const newBuyer = { name, phone };

    const [response, error] = await promiseResolver(
      gqlClient.request(INSERT_BUYER, {
        object: newBuyer,
      }),
    );
    if (error) {
      throw new Error("Failed to create buyer");
    }

    return res
      .status(201)
      .json({ message: "Buyer created successfully", buyer: newBuyer });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error creating buyer", error: error.message });
  }
};

export const buyerTransaction = async (req, res) => {
  try {
    const { selectedTransactions } = req.body;
    const output = Object.entries(selectedTransactions).map(([id, value]) => {
      return { buyer_purchase_id: id, amount: value.amount };
    });

    const [response, error] = await promiseResolver(
      gqlClient.request(INSERT_BUYER_TRANSACTION, {
        objects: output,
      }),
    );
    if (error) {
      throw new Error("Failed to create buyer transaction");
    }
    return res.status(201).json({
      message: "Buyer transaction created successfully",
      transaction: response.insert_buyer_buyer_transactions.returning,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Error creating buyer transaction",
      error: error.message,
    });
  }
};
