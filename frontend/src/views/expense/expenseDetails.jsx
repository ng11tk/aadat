import React, { use, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { FETCH_EXPENSE_TRANSACTIONS } from "../../graphql/query";
import { useQuery } from "@apollo/client/react";

const categoryColors = {
  Food: "bg-green-100 text-green-800",
  Repair: "bg-orange-100 text-orange-800",
  Commission: "bg-purple-100 text-purple-800",
  Salary: "bg-indigo-100 text-indigo-800",
  Advance: "bg-yellow-100 text-yellow-800",
  Bhada: "bg-pink-100 text-pink-800",
  "Market Fee": "bg-teal-100 text-teal-800",
};
const today = new Date();
const formatDate = (date) => date.toISOString().split("T")[0];

const ExpenseDetails = () => {
  const location = useLocation();
  const expense = location.state?.expense || [];
  const [expenses, setExpenses] = useState([]);
  const [filterMode, setFilterMode] = useState("thisMonth");
  const [fromDate, setFromDate] = useState(
    formatDate(new Date(today.getFullYear(), today.getMonth(), 1))
  );
  const [toDate, setToDate] = useState(formatDate(today));

  // where filter for expense transactions
  const whereTransaction = useMemo(() => {
    const w = {};
    w.category = { _eq: expense.category };
    if (!fromDate && toDate) {
      w.date = { _eq: toDate };
    }
    // only add date filter when both fromDate and toDate are present
    if (fromDate && toDate) {
      w.date = { _gte: fromDate, _lte: toDate };
    }

    return w;
  }, [fromDate, toDate]);
  console.log("🚀 ~ ExpenseDetails ~ whereTransaction:", whereTransaction);

  // Render expense details here
  const {
    loading: expenseLoading,
    error: expenseError,
    data: expenseData,
  } = useQuery(FETCH_EXPENSE_TRANSACTIONS, {
    variables: {
      where: whereTransaction,
      order_by: { date: "desc" },
    },
    fetchPolicy: "network-only",
  });

  const expenseTransactios = expenseData?.expense_transactions || [];

  useEffect(() => {
    if (!expenseData) return;
    setExpenses(expenseTransactios);
  }, [expenseData]);

  // quick filter
  const applyQuickFilter = (mode) => {
    setFilterMode(mode);
    if (mode === "today") setFromDate(setToDate(formatDate(today)));
    else if (mode === "thisWeek") {
      const firstDay = new Date(today);
      firstDay.setDate(today.getDate() - today.getDay());
      setFromDate(formatDate(firstDay));
      setToDate(formatDate(today));
    } else if (mode === "thisMonth") {
      setFromDate(
        formatDate(new Date(today.getFullYear(), today.getMonth(), 1))
      );
      setToDate(formatDate(today));
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen text-gray-900">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <h1 className="font-semibold text-gray-800">Expense Details</h1>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6 items-center">
          {["today", "thisWeek", "thisMonth", "custom"].map((mode) => (
            <button
              key={mode}
              onClick={() => applyQuickFilter(mode)}
              className={`px-4 py-2 rounded-lg border text-sm font-medium shadow-sm transition ${
                filterMode === mode
                  ? "bg-emerald-600 text-white border-emerald-600"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-emerald-50"
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

          {filterMode === "custom" && (
            <>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 shadow-sm"
              />
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-gray-700 shadow-sm"
              />
            </>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mb-6 grid md:grid-cols-2 gap-4">
        <div className="bg-white shadow-md rounded-xl p-4 border border-gray-200">
          <h2 className="text-lg font-semibold mb-1">{expense.category}</h2>
          {/* <p className="text-gray-600 text-sm">📞 {expense.contact}</p> */}
        </div>
        <div className="bg-white shadow-md rounded-xl p-4 border border-gray-200 flex justify-around">
          <div className="text-center">
            <p className="text-gray-500 text-sm">Total Amount</p>
            <p className="font-semibold text-indigo-600">
              ₹{expense?.amount ?? 0}
            </p>
          </div>

          <div className="text-center">
            <p className="text-gray-500 text-sm">Advance</p>
            <p className="font-semibold text-yellow-600">
              ₹{expense?.advance ?? 0}
            </p>
          </div>
          <div className="text-center">
            <p className="text-gray-500 text-sm">Total Expense</p>
            <p className="font-semibold text-red-600">
              ₹{expense?.amount || 0 + expense?.advance || 0}
            </p>
          </div>
        </div>
      </div>
      {/* Expense details content goes here */}
      {expenseLoading && <p>Loading...</p>}
      {expenseError && <p>Error: {expenseError.message}</p>}
      {/* Expense Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {expenses.length === 0 && (
          <p className="text-gray-500 italic">No expenses found</p>
        )}
        {expenses.map((exp) => (
          <motion.div
            key={exp.id}
            whileHover={{ y: -3, boxShadow: "0px 8px 20px rgba(0,0,0,0.1)" }}
            className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden transition"
          >
            {/* Category Color Strip */}
            <div className={`h-2 ${categoryColors[exp.category]}`} />

            {/* Card Content */}
            <div className="p-5">
              {/* Header */}
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-semibold text-gray-800">
                  {exp.category}
                </h3>
                <span className="text-sm text-gray-500">
                  {new Date(exp.date).toLocaleDateString()}
                </span>
              </div>

              {/* Details */}
              <div className="space-y-1 text-sm text-gray-600">
                {exp.person && (
                  <p>
                    👤 <span className="font-medium">{exp.person}</span>
                  </p>
                )}
                {exp?.bhada_details?.vehicle && (
                  <p>
                    🚚 Vehicle:{" "}
                    <span className="font-medium">
                      {exp.bhada_details.vehicle}
                    </span>
                  </p>
                )}
                {exp?.bhada_details?.modi && (
                  <p>
                    🏬 Supplier:{" "}
                    <span className="font-medium">
                      {exp.bhada_details.modi}
                    </span>
                  </p>
                )}
                {exp?.bhada_details?.item && (
                  <p>
                    📦 Item:{" "}
                    <span className="font-medium">
                      {exp.bhada_details.item}
                    </span>
                  </p>
                )}
                {exp?.description && (
                  <p className="italic text-gray-500">"{exp.description}"</p>
                )}
              </div>

              {/* Amount and Advance */}
              <div className="mt-4 flex justify-between items-center">
                <div>
                  <span className="text-sm text-gray-500">Amount</span>
                  <div className="text-lg font-bold text-emerald-600">
                    ₹{exp.amount}
                  </div>
                </div>
                {exp.advance >= 0 && (
                  <div className="text-right">
                    <span className="text-sm text-yellow-600">Advance</span>
                    <div className="text-lg font-bold text-yellow-600">
                      ₹{exp.advance}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};
export default ExpenseDetails;
