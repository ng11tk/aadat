import React, { useState } from "react";

// Helper to format YYYY-MM-DD
const formatDate = (date) => date.toISOString().split("T")[0];

const BorrowerSettlement = () => {
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const [paymentType, setPaymentType] = useState("complete");
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectedBorrower, setSelectedBorrower] = useState(null);

  // Default filter: This Month
  const [fromDate, setFromDate] = useState(formatDate(firstDayOfMonth));
  const [toDate, setToDate] = useState(formatDate(today));
  const [filterMode, setFilterMode] = useState("thisMonth");

  // Mock borrowers
  const borrowers = [
    {
      id: 1,
      name: "Nitin",
      items: [
        { id: 1, name: "Item A", amount: 2000, date: "2025-09-05" },
        { id: 2, name: "Item B", amount: 3000, date: "2025-09-10" },
      ],
    },
    {
      id: 2,
      name: "Amit",
      items: [
        { id: 3, name: "Item C", amount: 1500, date: "2025-09-07" },
        { id: 4, name: "Item D", amount: 2500, date: "2025-09-11" },
      ],
    },
  ];

  const applyQuickFilter = (mode) => {
    setFilterMode(mode);

    if (mode === "today") {
      const d = formatDate(today);
      setFromDate(d);
      setToDate(d);
    } else if (mode === "thisWeek") {
      const firstDayOfWeek = new Date(today);
      firstDayOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
      setFromDate(formatDate(firstDayOfWeek));
      setToDate(formatDate(today));
    } else if (mode === "thisMonth") {
      setFromDate(formatDate(firstDayOfMonth));
      setToDate(formatDate(today));
    }
  };

  const borrower =
    borrowers.find((b) => b.id === selectedBorrower) || borrowers[0];

  const filteredItems = borrower.items.filter((item) => {
    const itemDate = new Date(item.date);
    const from = new Date(fromDate);
    const to = new Date(toDate);
    return itemDate >= from && itemDate <= to;
  });

  const toggleItem = (id) => {
    setSelectedItems((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const totalAmount = filteredItems.reduce((sum, i) => sum + i.amount, 0);
  const paidAmount =
    paymentType === "complete"
      ? totalAmount
      : filteredItems
          .filter((i) => selectedItems.includes(i.id))
          .reduce((sum, i) => sum + i.amount, 0);
  const remaining = totalAmount - paidAmount;

  const handleConfirm = () => {
    console.log("✅ Settlement:", {
      borrower: borrower.name,
      paymentType,
      paidAmount,
      remaining,
      fromDate,
      toDate,
    });
  };

  return (
    <div className="p-6 bg-white min-h-screen text-gray-900">
      {/* Header with date filter on right */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Borrower Settlement</h1>

        {/* Date Filter */}
        <div className="flex items-center gap-3">
          {["today", "thisWeek", "thisMonth", "custom"].map((mode) => (
            <button
              key={mode}
              onClick={() => applyQuickFilter(mode)}
              className={`px-4 py-2 rounded-lg border ${
                filterMode === mode
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-white border-gray-300 text-gray-700"
              }`}
            >
              {mode === "today"
                ? "Today"
                : mode === "thisWeek"
                ? "This Week"
                : mode === "thisMonth"
                ? "This Month"
                : "Custom"}
            </button>
          ))}

          {/* Date pickers only if Custom */}
          {filterMode === "custom" && (
            <div className="flex gap-2">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
              />
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
              />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Borrower List */}
        <div className="bg-gray-50 shadow rounded-xl p-4 border border-gray-200">
          <h2 className="text-lg font-semibold mb-4">Borrowers</h2>
          <ul className="space-y-2">
            {borrowers.map((b) => (
              <li
                key={b.id}
                className={`p-3 rounded-lg cursor-pointer border ${
                  selectedBorrower === b.id
                    ? "bg-indigo-100 border-indigo-400"
                    : "bg-white border-gray-200"
                }`}
                onClick={() => setSelectedBorrower(b.id)}
              >
                {b.name}
              </li>
            ))}
          </ul>
        </div>

        {/* Borrower Details */}
        <div className="col-span-2">
          <div className="bg-gray-50 shadow rounded-xl p-6 mb-6 border border-gray-200">
            <h2 className="text-lg font-semibold">{borrower.name}</h2>
            <p className="mt-2">
              Total Amount (filtered):{" "}
              <span className="font-bold text-indigo-600">₹{totalAmount}</span>
            </p>
          </div>

          {/* Payment Type */}
          <div className="flex items-center gap-6 mb-6">
            <label className="flex items-center gap-2 text-gray-800">
              <input
                type="radio"
                checked={paymentType === "complete"}
                onChange={() => setPaymentType("complete")}
              />
              Complete
            </label>
            <label className="flex items-center gap-2 text-gray-800">
              <input
                type="radio"
                checked={paymentType === "partial"}
                onChange={() => setPaymentType("partial")}
              />
              Partial
            </label>
          </div>

          {paymentType === "partial" && (
            <div className="mb-6">
              <h3 className="text-lg font-medium mb-3">Select items paid</h3>
              <ul className="space-y-2">
                {filteredItems.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg border border-gray-200"
                  >
                    <input
                      type="checkbox"
                      checked={selectedItems.includes(item.id)}
                      onChange={() => toggleItem(item.id)}
                    />
                    <span>
                      {item.name} —{" "}
                      <span className="font-semibold">₹{item.amount}</span>{" "}
                      <span className="text-gray-500 text-sm">
                        ({item.date})
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Summary */}
          <div className="bg-gray-100 border rounded-lg p-4 flex justify-between items-center mb-6">
            <span className="text-gray-800 font-medium">
              Paid:{" "}
              <span className="text-green-600 font-bold">₹{paidAmount}</span>
            </span>
            <span className="text-gray-800 font-medium">
              Remaining:{" "}
              <span className="text-red-600 font-bold">₹{remaining}</span>
            </span>
          </div>

          <button
            onClick={handleConfirm}
            className="px-6 py-2 bg-indigo-600 text-white font-semibold rounded-lg shadow hover:bg-indigo-700"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default BorrowerSettlement;
