import React from "react";

const PaymentStatusFilter = ({ statusFilter, setStatusFilter }) => {
  const paymentStatusOptions = [
    { key: "all", label: "All" },
    { key: "paid", label: "Paid" },
    { key: "partial", label: "Partial" },
  ];

  return (
    <div className="flex gap-2">
      {paymentStatusOptions.map((status) => (
        <button
          key={status.key}
          onClick={() => setStatusFilter(status.key)}
          className={`px-4 py-2 rounded-full border text-sm font-medium transition ${
            statusFilter === status.key
              ? status.key === "paid"
                ? "bg-indigo-600 text-white border-indigo-600 shadow"
                : status.key === "partial"
                  ? "bg-red-500 text-white border-red-500 shadow"
                  : "bg-indigo-600 text-white border-indigo-600 shadow"
              : "bg-white border-gray-300 text-gray-700 hover:bg-gray-100"
          }`}
        >
          {status.label}
        </button>
      ))}
    </div>
  );
};

export default PaymentStatusFilter;
