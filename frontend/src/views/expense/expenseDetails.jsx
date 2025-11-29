import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FETCH_EXPENSE_TRANSACTIONS,
  FETCH_EMPLOYEES,
} from "../../graphql/query";
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
  const [expenseTotal, setExpenseTotal] = useState({});
  const [filterMode, setFilterMode] = useState("thisMonth");
  const [fromDate, setFromDate] = useState(
    formatDate(new Date(today.getFullYear(), today.getMonth(), 1))
  );
  const [toDate, setToDate] = useState(formatDate(today));
  const [personFilter, setPersonFilter] = useState("");

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

    // apply person filter for Salary/Commission categories
    if (["Salary", "Commission"].includes(expense.category) && personFilter) {
      // expense transactions store employee relation as expense_emp_id
      w.expense_emp_id = { _eq: personFilter };
    }

    return w;
  }, [fromDate, toDate, personFilter, expense.category]);

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

  // fetch employees for person filter
  const { data: employeeData } = useQuery(FETCH_EMPLOYEES, {
    variables: {
      where: {
        category: { _eq: expense.category },
      },
    },
  });
  const employees = employeeData?.expense_employees || [];

  useEffect(() => {
    if (!expenseData) return;

    setExpenseTotal(
      expenseData?.expense_transactions_aggregate?.aggregate?.sum || {}
    );
    setExpenses(expenseData?.expense_transactions_aggregate.nodes || []);
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

        {/* Redesigned Filter Bar */}
        <div className="w-full bg-white rounded-xl border border-gray-200 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-none">
              <p className="font-semibold text-gray-800">Filters :</p>
            </div>

            <div className="flex-auto flex items-center gap-2 flex-wrap">
              {/* Quick filters */}
              <div className="flex gap-2">
                {[
                  { k: "today", l: "Today" },
                  { k: "thisWeek", l: "This Week" },
                  { k: "thisMonth", l: "This Month" },
                  { k: "custom", l: "Custom" },
                ].map((mode) => (
                  <button
                    key={mode.k}
                    onClick={() => applyQuickFilter(mode.k)}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition ${
                      filterMode === mode.k
                        ? "bg-emerald-600 text-white"
                        : "bg-gray-50 text-gray-700 border border-gray-200 hover:bg-emerald-50"
                    }`}
                  >
                    {mode.l}
                  </button>
                ))}
              </div>

              {/* Date range (visible only for custom) */}
              {filterMode === "custom" && (
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="px-2 py-1 rounded-md border border-gray-300 text-sm"
                  />
                  <span className="text-sm text-gray-400">to</span>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="px-2 py-1 rounded-md border border-gray-300 text-sm"
                  />
                </div>
              )}

              {/* Person filter */}
              {["Salary", "Commission"].includes(expense.category) && (
                <div className="min-w-[180px] flex gap-2 ml-auto">
                  <select
                    className="w-full px-3 py-1 rounded-md border border-gray-300 text-sm"
                    value={personFilter || ""}
                    onChange={(e) => setPersonFilter(e.target.value)}
                  >
                    <option value="">All Persons</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.id}>
                        {emp.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mb-6 grid md:grid-cols-2 gap-4">
        <div className="bg-white shadow-md rounded-xl p-4 border border-gray-200">
          {/* Show employee details if person is filtered */}
          {/* {personFilter && employees.length > 0 && (
            <>
              {(() => {
                const emp = employees.find((e) => e.id === personFilter);
                return emp ? (
                  <div className="space-y-2 text-left text-sm text-gray-600">
                    <p>
                      👤 <span className="font-medium">{emp.name}</span>
                    </p>
                    {emp.category && (
                      <p>
                        📂 Category:{" "}
                        <span className="font-medium">{emp.category}</span>
                      </p>
                    )}
                    {emp.phone && (
                      <p>
                        📞 <span className="font-medium">{emp.phone}</span>
                      </p>
                    )}
                    {emp.address && (
                      <p>
                        📍 <span className="font-medium">{emp.address}</span>
                      </p>
                    )}
                    {emp.salary && (
                      <p>
                        💰 Salary:{" "}
                        <span className="font-medium">₹{emp.salary}</span>
                      </p>
                    )}
                    {emp.date_of_join && (
                      <p>
                        📅 Joined:{" "}
                        <span className="font-medium">
                          {new Date(emp.date_of_join).toLocaleDateString()}
                        </span>
                      </p>
                    )}
                  </div>
                ) : null;
              })()}
            </>
          )} */}
          {personFilter &&
            employees.length > 0 &&
            (() => {
              const emp = employees.find((e) => e.id === personFilter);

              return emp ? (
                <div>
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-12 h-12 flex items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-semibold text-lg">
                      {emp.name?.[0]?.toUpperCase()}
                    </div>

                    {/* Basic info */}
                    <div>
                      <p className="text-base font-semibold text-gray-800">
                        {emp.name}
                      </p>
                      <p className="text-xs text-gray-500">{emp.category}</p>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="mt-4 space-y-2 text-sm text-gray-700">
                    {emp.phone && (
                      <div className="flex items-center gap-2">
                        <span className="text-emerald-500">📞</span>
                        <span className="font-medium">{emp.phone}</span>
                      </div>
                    )}

                    {emp.address && (
                      <div className="flex items-center gap-2">
                        <span className="text-blue-500">📍</span>
                        <span className="font-medium">{emp.address}</span>
                      </div>
                    )}

                    {emp.joined_on && (
                      <div className="flex items-center gap-2">
                        <span className="text-purple-500">🗓️</span>
                        <span className="font-medium">{emp.joined_on}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : null;
            })()}
          {!personFilter && (
            <h2 className="text-lg font-semibold mb-1">{expense.category}</h2>
          )}
        </div>
        <div className="bg-white shadow-md rounded-xl p-4 border border-gray-200 flex justify-around">
          <div className="text-center">
            <p className="text-gray-500 text-sm">Total Amount</p>
            <p className="font-semibold text-indigo-600">
              ₹{expenseTotal?.amount ?? 0}
            </p>
          </div>

          <div className="text-center">
            <p className="text-gray-500 text-sm">Advance</p>
            <p className="font-semibold text-yellow-600">
              ₹{expenseTotal?.advance ?? 0}
            </p>
          </div>
          <div className="text-center">
            <p className="text-gray-500 text-sm">Total Expense</p>
            <p className="font-semibold text-red-600">
              ₹{expenseTotal?.amount || 0 + expenseTotal?.advance || 0}
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
                  {exp?.employee?.name ? exp?.employee?.name : exp.category}
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
