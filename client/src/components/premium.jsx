import axios from "axios";
import React from "react";
import api from "../lib/axios";
import { promiseResolver } from "../../../server/utils/promiseResolver";

const Premium = () => {
  const handleBuyClick = async (plan) => {
    // Handle the buy button click for the selected plan
    console.log(`User selected the ${plan} plan.`);
    // You can add your logic here to process the payment or redirect to a payment page

    const [order, orderError] = await promiseResolver(
      api.post(
        "/api/v1/payments/create",
        { membershipType: plan },
        { withCredentials: true },
      ),
    );
    console.log(order);

    // razorpay

    const { keyId, amount, currency, orderId } = order.data.orderPayment;
    const options = {
      key: keyId,
      amount: amount,
      currency: currency,
      name: "Aadat Corp",
      description: "Test Transaction",
      order_id: orderId,
      // callback_url: 'http://localhost:3000/payment-success', // Your success URL
      // prefill: {
      //   name: 'Gaurav Kumar',
      //   email: 'gaurav.kumar@example.com',
      //   contact: '9999999999'
      // },
      theme: {
        color: "#F37254",
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  return (
    <div className="card w-96 bg-base-100 shadow-sm">
      <div className="card-body">
        <span className="badge badge-xs badge-warning">Most Popular</span>
        <div className="flex justify-between">
          <h2 className="text-3xl font-bold">Premium</h2>
          <span className="text-xl">$29/mo</span>
        </div>
        <ul className="mt-6 flex flex-col gap-2 text-xs">
          <li>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="size-4 me-2 inline-block text-success"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span>High-resolution image generation</span>
          </li>
          <li>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="size-4 me-2 inline-block text-success"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span>Customizable style templates</span>
          </li>
          <li>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="size-4 me-2 inline-block text-success"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span>Batch processing capabilities</span>
          </li>
          <li>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="size-4 me-2 inline-block text-success"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span>AI-driven image enhancements</span>
          </li>
          <li className="opacity-50">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="size-4 me-2 inline-block text-base-content/50"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="line-through">Seamless cloud integration</span>
          </li>
          <li className="opacity-50">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="size-4 me-2 inline-block text-base-content/50"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="line-through">Real-time collaboration tools</span>
          </li>
        </ul>
        <div className="mt-6">
          <button
            className="btn btn-primary btn-block"
            onClick={() => handleBuyClick("gold")}
          >
            Subscribe
          </button>
        </div>
      </div>
    </div>
  );
};

export default Premium;
