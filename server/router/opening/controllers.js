import { INSERT_OPENING, UPDATE_UNLOADING } from "../../graphql/mutation.js";
import { gqlClient } from "../../lib/graphql.js";
import { promiseResolver } from "../../utils/promisResolver.js";

export const createUnloading = async (req, res) => {
  try {
    const newItem = req.body;

    // Validate required fields
    if (!newItem || !newItem.unloading_items?.length) {
      return res.status(400).json({ message: "Invalid request data" });
    }

    // Validate supplier name
    if (newItem.type === "supplier" && !newItem.name?.trim()) {
      return res.status(400).json({ message: "Supplier name is required" });
    }

    const totalKharcha = Object.values(newItem.kharcha_details).reduce(
      (sum, val) => sum + (Number(val) || 0),
      0,
    );

    const itemsTotalAmount = newItem.unloading_items.reduce(
      (sum, it) => sum + (Number(it.rate) || 0) * (Number(it.quantity) || 0),
      0,
    );

    const item = {
      ...newItem,
      amount_paid: Number(newItem.amount_paid) || 0,
      advance: Number(newItem.advance) || 0,
      unloading_items: newItem.unloading_items.map((it) => ({
        ...it,
        rate: Number(it.rate) || 0,
        quantity: Number(it.quantity) || 0,
        remaining_quantity: Number(it.quantity) || 0,
      })),
      kharcha_details: {
        commission: Number(newItem.kharcha_details.commission) || 0,
        labour: Number(newItem.kharcha_details.labour) || 0,
        market: Number(newItem.kharcha_details.market) || 0,
        driver_gift: Number(newItem.kharcha_details.driver_gift) || 0,
      },
    };

    const customObject = {
      type: item.type,
      name: item.name,
      amount: totalKharcha + itemsTotalAmount,
      advance_amount: item.advance,
      bhada_details: {
        bhada: Number(item.bhada) || 0,
        vehicle_number: item.vehicle_number,
      },
      kharcha_details: item.kharcha_details,
      unloading_date: new Date().toISOString().split("T")[0],
      isDayClose: true,
      unloading_items: {
        data: item.unloading_items.map((it) => ({
          name: it.name,
          rate: it.rate,
          quantity: it.quantity,
          remaining_quantity: it.quantity,
          unit: it.unit,
          isSellable: it.isSellable,
        })),
      },
      supplier_unloading: {
        data: {
          supplier_name: item.name,
          amount: totalKharcha + itemsTotalAmount,
          remaining_amount: totalKharcha + itemsTotalAmount - item.advance,
          payment_status:
            totalKharcha + itemsTotalAmount - item.advance <= 0
              ? "paid"
              : "partial",
          unloading_date: new Date().toISOString().split("T")[0],
          advance_amount: item.advance,
        },
      },
      expense_bills: {
        data: {
          category: "Bhada",
          advance: 0,
          amount: Number(item.bhada) || 0,
          remaining_amount: Number(item.bhada) || 0,
          payment_status: "partial",
          bhada_details: {
            vehicle: item.vehicle_number,
            modi: item.name,
            item: Array.isArray(item.unloading_items)
              ? item.unloading_items.map((i) => i.name)
              : [],
          },
          date: new Date().toISOString().split("T")[0],
        },
      },
    };

    const [data, error] = await promiseResolver(
      gqlClient.request(INSERT_OPENING, {
        object: customObject,
      }),
    );

    if (error) {
      console.error("Error inserting opening:", error);
      return res.status(500).json({ message: "Failed to create opening" });
    }

    return res.status(201).json({
      message: "Opening created successfully",
      data,
    });
  } catch (error) {
    console.error("Unexpected error in createUnloading:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};

export const updateUnloading = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Validate required fields
    if (!id || updateData == null) {
      return res.status(400).json({ message: "Invalid request data" });
    }

    const [data, err] = await promiseResolver(
      gqlClient.request(UPDATE_UNLOADING, {
        pk_columns: { id },
        _set: updateData,
      }),
    );

    if (err) {
      console.error("Error updating unloading status:", err);
      return res
        .status(500)
        .json({ message: "Failed to update unloading status" });
    }

    return res.status(200).json({
      message: `Unloading status updated successfully`,
      data,
    });
  } catch (error) {
    console.error("Unexpected error in updateUnloadingStatus:", error);
    return res
      .status(500)
      .json({ message: "Failed to update unloading status" });
  }
};
