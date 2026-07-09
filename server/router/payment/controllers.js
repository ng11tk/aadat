import { CREATE_PAYMENT_ORDER } from "../../graphql/mutation.js";
import { promiseResolver } from "../../utils/promiseResolver.js";
import razorpayInstance from "../../utils/razorpay.js";
import { gqlClient } from "../../lib/graphql.js";

export const paymentCreate = async (req, res) => {
  try {
    const order = await razorpayInstance.orders.create({
      amount: 50000, // ₹500
      currency: "INR",
      receipt: "receipt_123",
      notes: {
        userId: "123",
      },
    });
    console.log("🚀 ~ paymentCreate ~ order:", order);

    // save order in your database if needed
    const orderInput = {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      status: order.status,
      userId: "cb916e37-966e-45b4-a4af-43e9f54ad139", //todo: replace with actual user ID
      notes: order.notes,
    };

    const [insertPaymentOrder, insertPaymentOrderError] = await promiseResolver(
      gqlClient.request(CREATE_PAYMENT_ORDER, {
        object: orderInput,
      }),
    );

    if (insertPaymentOrderError) {
      console.error("Error inserting payment order:", insertPaymentOrderError);
      return res.status(500).json({ message: "Internal server error" });
    }

    // send order details to the client
    return res.status(200).json({
      status: "success",
      message: "Payment created successfully",
      orderPayment: insertPaymentOrder,
    });
  } catch (error) {
    console.error("Error creating payment:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to create payment",
    });
  }

  return res.status(200).json({
    status: "success",
    message: "Payment created successfully",
  });
};
