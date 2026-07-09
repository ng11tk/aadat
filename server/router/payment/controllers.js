import { CREATE_PAYMENT_ORDER, UPDATE_PAYMENT_ORDER } from "../../graphql/mutation.js";
import { promiseResolver } from "../../utils/promiseResolver.js";
import razorpayInstance from "../../utils/razorpay.js";
import { gqlClient } from "../../lib/graphql.js";
import { membershipTypes } from "../../utils/constant.js";

export const paymentCreate = async (req, res) => {
  try {
    const { membershipType } = req.body;
    const userDetails = req.user; // Assuming user details are attached to the request by authentication middleware

    const order = await razorpayInstance.orders.create({
      amount: membershipTypes[membershipType]?.price,
      currency: "INR",
      receipt: "receipt_123",
      notes: {
        userId: userDetails.id,
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
      userId: userDetails.id, // Use the actual user ID from the authenticated user
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
      orderPayment: {
        ...insertPaymentOrder?.insert_payment_payments_one,
        keyId: process.env.RAZORPAY_KEY_ID,
      },
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

export const verifyPayment = async (req, res) => {
  // Handle webhook logic here

  try {
    const webhookData = req.body;
    console.log("Webhook received:", webhookData);

    const isWebhookValid = validateWebhookSignature(
      JSON.stringify(req.body),
      req.headers["x-razorpay-signature"],
      process.env.RAZORPAY_WEBHOOK_SECRET,
    );

    if (!isWebhookValid) {
      console.error("Invalid webhook signature");
      return res.status(400).send("Invalid signature");
    }

    const paymentDetails = webhookData.payload.payment.entity;
    console.log("Payment details:", paymentDetails);

    // update the payment status as completed
    // update the user as premium user

    const [updatePaymentStatus, updatePaymentStatusError] =
      await promiseResolver(
        gqlClient.request(UPDATE_PAYMENT_ORDER, {
          where: { orderId: { _eq: paymentDetails.order_id } },
          status: paymentDetails.status,
        }),
      );

    // if (webhookData.event === "payment.captured") {
    //   // Handle payment captured event
    //   console.log("Payment captured:", webhookData.payload.payment.entity);

    // }

    // if (webhookData.event === "payment.failed") {
    //   // Handle payment failed event
    //   console.log("Payment failed:", webhookData.payload.payment.entity);
    //   // You can update your database or perform any other actions here
    // }

    return res.status(200).send("Webhook received and processed");
  } catch (error) {
    console.error("Error processing webhook:", error);
  }

  res.status(200).send("Webhook received");
};
