import React, { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { FETCH_EXPENSE_BILLS, FETCH_EMPLOYEES } from "../../graphql/query";
import { useQuery, useMutation } from "@apollo/client/react";
import { INSERT_EXPENSE_TRANSACTIONS } from "../../graphql/mutation";
import { promiseResolver } from "../../utils/promisResolver";

const categoryColors = {
  Food: "bg-green-100 text-green-800",
  Repair: "bg-orange-100 text-orange-800",
  Commission: "bg-purple-100 text-purple-800",
  Salary: "bg-emerald-100 text-emerald-800",
  Advance: "bg-yellow-100 text-yellow-800",
  Bhada: "bg-pink-100 text-pink-800",
  "Market Fee": "bg-teal-100 text-teal-800",
};
const today = new Date();
const formatDate = (date) => date.toISOString().split("T")[0];

const formatCurrency = (v) => {
  if (v === undefined || v === null) return "₹0";
  try {
    return (
      "₹" +
      new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(
        Number(v)
      )
    );
  } catch {
    return `₹${v}`;
  }
};

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

  // where filter for expense expense_bills
  const whereBill = useMemo(() => {
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
      // expense expense_bills store employee relation as expense_emp_id
      w.expense_emp_id = { _eq: personFilter };
    }

    return w;
  }, [fromDate, toDate, personFilter, expense.category]);

  //* fetches
  // Render expense details here
  const {
    loading: expenseLoading,
    error: expenseError,
    data: expenseData,
    refetch: expenseRefetch,
  } = useQuery(FETCH_EXPENSE_BILLS, {
    variables: {
      where: whereBill,
      order_by: { date: "desc" },
    },
    fetchPolicy: "network-only",
  });

  //* mutations
  const [insertExpenseTransactions] = useMutation(INSERT_EXPENSE_TRANSACTIONS);

  // payment selection state (id -> { mode: 'full'|'partial', amount, finalized })
  const [selectedPayments, setSelectedPayments] = useState({});

  const updatePaymentSelection = (id, mode, amount = 0) => {
    const t = expenses.find((e) => e.id === id);
    const due = (t?.amount || 0) - (t?.advance || 0);
    if (!t || due <= 0) return;
    setSelectedPayments((prev) => {
      if (prev[id]?.mode === mode) {
        const newObj = { ...prev };
        delete newObj[id];
        return newObj;
      }
      return {
        ...prev,
        [id]: { mode, amount: mode === "full" ? due : amount || 0 },
      };
    });
  };

  const savePartial = (id, amount, due) => {
    if (!amount || amount <= 0) return;
    if (amount >= due) {
      updatePaymentSelection(id, "full");
      return;
    }
    setSelectedPayments((prev) => ({
      ...prev,
      [id]: { ...(prev[id] || {}), mode: "partial", amount, finalized: true },
    }));
  };

  const totalSelectedAmount = Object.values(selectedPayments).reduce(
    (sum, t) => sum + (t.amount || 0),
    0
  );

  const [isProcessing, setIsProcessing] = useState(false);

  const handleConfirmPayments = async () => {
    const output = Object.entries(selectedPayments).map(([id, v]) => ({
      expense_bill_id: id,
      amount: v.amount || 0,
      date: formatDate(new Date()),
    }));

    if (output.length === 0) return;

    setIsProcessing(true);
    const [, error] = await promiseResolver(
      insertExpenseTransactions({ variables: { objects: output } })
    );
    setIsProcessing(false);
    if (error) {
      console.error("Error inserting expense payments:", error);
      return;
    }
    setSelectedPayments({});
    if (typeof expenseRefetch === "function") expenseRefetch();
  };

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
      expenseData?.expense_expense_bills_aggregate?.aggregate?.sum || {}
    );
    setExpenses(expenseData?.expense_expense_bills_aggregate.nodes || []);
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
        <div className="bg-white shadow-md rounded-xl p-4 border border-gray-200 flex justify-around items-center">
          <div className="text-center">
            <p className="text-gray-500 text-sm">Total Amount</p>
            <p className="font-semibold text-emerald-600">
              {formatCurrency(expenseTotal?.amount ?? 0)}
            </p>
          </div>

          <div className="text-center">
            <p className="text-gray-500 text-sm">Advance</p>
            <p className="font-semibold text-yellow-600">
              {formatCurrency(expenseTotal?.advance ?? 0)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-gray-500 text-sm">Total Due</p>
            <p className="font-semibold text-red-600">
              {formatCurrency(expenseTotal?.remaining_amount || 0)}
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
        {expenses.map((exp) => {
          const due = exp.remaining_amount || 0;
          const isPaid = due <= 0;
          const isSelected = Boolean(selectedPayments[exp.id]);
          const selectionInfo = isSelected ? selectedPayments[exp.id] : null;

          const info = selectedPayments[exp.id] || {
            mode: "full",
            amount: due,
          };
          return (
            <motion.div
              key={exp.id}
              layout
              whileHover={{ y: -3, boxShadow: "0px 8px 20px rgba(0,0,0,0.1)" }}
              className={`relative rounded-2xl overflow-hidden transition cursor-pointer ${
                isPaid
                  ? "bg-emerald-50 border-2 border-emerald-400 shadow-lg ring-2 ring-emerald-200"
                  : "bg-white border border-gray-200 shadow-sm"
              }`}
            >
              {/* Status & Selection Tags */}
              <>
                {/* Payment Status Tag (top-right) */}
                <div className="absolute top-3 right-3 z-10">
                  <span
                    className={`px-3 py-1.5 text-xs font-bold rounded-full ${
                      isPaid
                        ? "bg-emerald-600 text-white"
                        : "bg-yellow-500 text-white"
                    }`}
                  >
                    {isPaid ? "✓ Paid" : "⚠ Unpaid"}
                  </span>
                </div>

                {/* Selection Badge (top-left) */}
                {isSelected && (
                  <div className="absolute top-3 left-3 z-20">
                    <div className="bg-emerald-600 text-white rounded-lg px-3 py-1.5 flex items-center gap-2 shadow-md border border-emerald-700">
                      <span className="text-sm font-bold">✓ Selected</span>
                      <span className="text-xs bg-emerald-700 px-2 py-0.5 rounded font-semibold">
                        {selectionInfo?.mode === "full"
                          ? "Full"
                          : `₹${selectionInfo?.amount || 0}`}
                      </span>
                    </div>
                  </div>
                )}
              </>

              {/* Category Color Strip */}
              <div className={`h-2 ${categoryColors[exp.category]}`} />

              {/* Card Content */}
              <div className="p-6">
                {/* Header */}
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-semibold">
                      {exp?.employee?.name?.[0]?.toUpperCase() ||
                        exp.category?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">
                        {exp?.employee?.name
                          ? exp?.employee?.name
                          : exp.category}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {exp.person || exp.description || ""}
                      </p>
                    </div>
                  </div>
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
                {/* Amount, Advance, and Due */}
                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div>
                    <p className="text-sm text-gray-500">Amount</p>
                    <div className="text-lg font-bold text-emerald-600">
                      {formatCurrency(exp.amount)}
                    </div>
                  </div>

                  <div className="text-center">
                    <p className="text-sm text-yellow-600">Advance</p>
                    <div className="text-lg font-bold text-yellow-600">
                      {formatCurrency(exp.advance)}
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-sm text-red-600">Due</p>
                    <div className="text-lg font-bold text-red-600">
                      {formatCurrency(exp.remaining_amount || 0)}
                    </div>
                  </div>
                </div>
                {/* Payment actions (similar to supplierDetails) */}
                {!isPaid && (
                  <div className="mt-3 space-y-2">
                    <div className="flex gap-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updatePaymentSelection(exp.id, "full");
                        }}
                        className={`flex-1 px-3 py-1 rounded-full text-sm font-medium ${
                          info.mode === "full"
                            ? "bg-emerald-500 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-emerald-100"
                        }`}
                      >
                        Full
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          updatePaymentSelection(
                            exp.id,
                            "partial",
                            info.amount || 0
                          );
                        }}
                        className={`flex-1 px-3 py-1 rounded-full text-sm font-medium ${
                          info.mode === "partial"
                            ? "bg-yellow-400 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-yellow-100"
                        }`}
                      >
                        Partial
                      </button>
                    </div>

                    {info.mode === "partial" && !info.finalized && (
                      <div className="flex gap-2 mt-2">
                        <input
                          type="number"
                          min={0}
                          max={due}
                          value={info.amount || ""}
                          onChange={(e) =>
                            setSelectedPayments((prev) => ({
                              ...prev,
                              [exp.id]: {
                                ...(prev[exp.id] || {}),
                                amount: Number(e.target.value),
                              },
                            }))
                          }
                          className="flex-1 input input-sm input-bordered bg-white"
                          placeholder="Amount"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            savePartial(exp.id, info.amount, due);
                          }}
                          className="px-3 py-1 rounded-full bg-emerald-600 text-white text-sm"
                        >
                          ✔
                        </button>
                      </div>
                    )}

                    {info.mode === "partial" && info.finalized && (
                      <p className="text-xs mt-1 text-orange-600 font-medium">
                        Partial Selected: ₹{info.amount}
                      </p>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Total Selected Payable (sticky) */}
      {Object.keys(selectedPayments).length > 0 && (
        <div className="fixed bottom-6 right-6 z-50 w-[360px]">
          <div className="bg-white shadow-lg rounded-xl p-4 flex items-center justify-between gap-3 border border-gray-200">
            <div>
              <div className="text-sm text-gray-600">
                Total Selected Payable
              </div>
              <div className="text-xl font-bold text-emerald-600">
                {formatCurrency(totalSelectedAmount)}
              </div>
            </div>
            <button
              className={`px-4 py-2 rounded-lg text-white font-semibold ${
                isProcessing
                  ? "bg-gray-400"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }`}
              onClick={handleConfirmPayments}
              disabled={isProcessing}
            >
              {isProcessing ? "Processing..." : "Confirm Payment"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
export default ExpenseDetails;
