import {
  INSERT_SALES_ORDER_ITEMS,
  UPSERT_SALES_ORDER,
} from "../../graphql/mutation.js";
import { FIND_SALES_ORDERS } from "../../graphql/query.js";
import { gqlClient } from "../../lib/graphql.js";
import { promiseResolver } from "../../utils/promisResolver.js";

export const createSalesOrder = async (req, res) => {
  // Logic to create a sales order
  try {
    const payload = req.body;
    const { buyer_id: selectedBuyer, total_amount: totalAmount } = payload;

    if (!selectedBuyer || !totalAmount) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Additional logic to create the sales order can be added here
    const [result, error] = await promiseResolver(
      gqlClient.request(FIND_SALES_ORDERS, {
        where: {
          buyer_id: { _eq: selectedBuyer },
          order_date: { _eq: new Date().toISOString().split("T")[0] },
        },
      }),
    );
    if (error) {
      console.error("Error fetching existing sales orders:", error);
      return res
        .status(500)
        .json({ message: "Failed to fetch existing sales orders" });
    }
    const existingOrdersData = result;

    const existingOrder = existingOrdersData?.sales_sales_order?.[0] || false;

    if (existingOrder) {
      // Save previous total to allow rollback if item insertion fails
      const previousTotal = existingOrder.total_amount || 0;
      const updatedTotal = previousTotal + totalAmount;

      // Update the sales order total first
      const [resultUpdate, errorUpdate] = await promiseResolver(
        gqlClient.request(UPSERT_SALES_ORDER, {
          object: {
            id: existingOrder.id,
            buyer_id: payload.buyer_id,
            total_amount: updatedTotal,
            order_date: payload.order_date,
            items_missing_rate_count: payload.items_missing_rate_count,
          },
        }),
      );
      if (errorUpdate) {
        console.error("Error updating sales order total:", errorUpdate);
        return res
          .status(500)
          .json({ message: "Failed to update sales order total" });
      }
      const updateData = resultUpdate;

      console.log("Sales order total updated:", updateData);
      // Then insert the new items. If this fails, attempt to rollback the total_amount.
      try {
        const [insertItemsData, insertItemsError] = await promiseResolver(
          gqlClient.request(INSERT_SALES_ORDER_ITEMS, {
            objects: payload.sales_order_items.data.map((it) => ({
              ...it,
              order_id: existingOrder.id,
            })),
          }),
        );
        if (insertItemsError) {
          throw insertItemsError;
        }

        console.log("Sales order items updated:", insertItemsData);
      } catch (insertErr) {
        console.error(
          "Failed to insert sales order items, attempting rollback:",
          insertErr,
        );
        try {
          // Rollback total_amount to previous value
          const [rollbackData, rollbackError] = await promiseResolver(
            gqlClient.request(UPSERT_SALES_ORDER, {
              object: {
                id: existingOrder.id,
                total_amount: previousTotal,
              },
            }),
          );
          if (rollbackError) {
            throw rollbackError;
          }

          console.log("Rollback successful:", rollbackData);
        } catch (rollbackErr) {
          console.error("Rollback failed:", rollbackErr);
          return res.status(500).json({
            message:
              "Failed to add order items and rollback also failed. Check console for details.",
          });
        }

        // Surface error to user and stop submission
        return res.status(500).json({
          message:
            "Failed to add order items. The order has been rolled back (or rollback attempted). Check console.",
        });
      }
    } else {
      const [resultInsert, errorInsert] = await promiseResolver(
        gqlClient.request(UPSERT_SALES_ORDER, {
          object: payload,
        }),
      );
      if (errorInsert) {
        console.error("Error inserting new sales order:", errorInsert);
        return res
          .status(500)
          .json({ message: "Failed to insert new sales order" });
      }
      const insertData = resultInsert;

      console.log("New sales order created:", insertData);
    }

    res.status(201).json({ message: "Sales order created successfully" });
  } catch (error) {
    res.status(500).json({ error: "Internal server error" });
  }
};
