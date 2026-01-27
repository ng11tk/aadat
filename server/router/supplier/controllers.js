import {
  INSERT_SUPPLIER,
  INSERT_SUPPLIER_TRANSACTION,
} from "../../graphql/mutation.js";
import { gqlClient } from "../../lib/graphql.js";
import { promiseResolver } from "../../utils/promisResolver.js";

export const createSupplier = async (req, res) => {
  try {
    const { customObject } = req.body;
    if (!customObject) {
      return res.status(400).json({ error: "Missing supplier data" });
    }

    const [data, err] = await promiseResolver(
      gqlClient.request(INSERT_SUPPLIER, {
        object: customObject,
      }),
    );
    if (err) {
      console.error("Error inserting supplier:", err);
      return res.status(500).json({ error: "Failed to create supplier" });
    }

    return res.status(201).json(data.insert_supplier_supplier_one);
  } catch (error) {
    console.error("Error in createSupplier:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const supplierTransactions = async (req, res) => {
  // Implementation for supplier transactions
  try {
    const { selectedTransactions } = req.body;
    if (
      !selectedTransactions ||
      Object.keys(selectedTransactions).length === 0
    ) {
      return res
        .status(400)
        .json({ error: "No transactions provided for insertion" });
    }

    const output = Object.entries(selectedTransactions).map(([id, value]) => {
      return { supplier_unloading_id: id, amount: value.amount };
    });

    // transaction insertion logic goes here
    const [data, err] = await promiseResolver(
      gqlClient.request(INSERT_SUPPLIER_TRANSACTION, {
        objects: output,
      }),
    );
    if (err) {
      console.error("Error inserting supplier transactions:", err);
      return res
        .status(500)
        .json({ error: "Failed to insert supplier transactions" });
    }

    // Placeholder response
    return res.status(200).json({ message: "Supplier transactions endpoint" });
  } catch (error) {
    console.error("Error in supplierTransactions:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
