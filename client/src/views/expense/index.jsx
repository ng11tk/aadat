import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useApolloClient, useMutation, useQuery } from "@apollo/client/react";
import { INSERT_EXPENSE_BILLS } from "../../graphql/mutation";
import { promiseResolver } from "../../utils/promisResolver";
import {
  FETCH_EMPLOYEES,
  GET_EXPENSE_CATEGORIES_AGGREGATE,
} from "../../graphql/query";
import { useNavigate } from "react-router-dom";

const today = new Date();
const formatDate = (date) => date.toISOString().split("T")[0];

const categoryColors = {
  Food: "bg-green-100 text-green-800",
  Repair: "bg-orange-100 text-orange-800",
  Commission: "bg-purple-100 text-purple-800",
  Salary: "bg-indigo-100 text-indigo-800",
  Advance: "bg-yellow-100 text-yellow-800",
  Bhada: "bg-pink-100 text-pink-800",
  "Market Fee": "bg-teal-100 text-teal-800",
};
const expenseSample = [
  {
    id: 1,
    category: "Food",
    description: "Lunch for team",
    amount: 500,
    date: "2025-09-18",
  },
  {
    id: 2,
    category: "Repair",
    description: "Machine repair",
    amount: 1200,
    date: "2025-09-16",
  },
  {
    id: 3,
    category: "Commission",
    person: "Ramesh",
    amount: 2000,
    date: "2025-09-15",
  },
  {
    id: 4,
    category: "Salary",
    person: "Sita",
    amount: 15000,
    date: "2025-09-01",
  },
  {
    id: 6,
    category: "Bhada",
    vehicle: "MH12AB1234",
    modi: "Supplier X",
    item: "Fertilizer",
    amount: 800,
    date: "2025-09-12",
  },
  { id: 7, category: "Market Fee", amount: 100, date: "2025-09-14" },
];

const ExpensePage = () => {
  const client = useApolloClient();

  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [filterMode, setFilterMode] = useState("thisMonth");
  const [fromDate, setFromDate] = useState(
    formatDate(new Date(today.getFullYear(), today.getMonth(), 1))
  );
  const [toDate, setToDate] = useState(formatDate(today));
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newExpense, setNewExpense] = useState({
    category: "Food",
    description: "",
    person: "",
    vehicle: "",
    modi: "",
    item: "",
    amount: "",
    date: "",
  });
  const [employeesList, setemployeesList] = useState([]);

  // insert expense
  const [insertExpensebill] = useMutation(INSERT_EXPENSE_BILLS);

  // fetch expenses with filters
  const { data: employeeData } = useQuery(FETCH_EMPLOYEES);
  const employees = employeeData?.expense_employees || [];
  useEffect(() => {
    if (!employeeData) return;
    setemployeesList(employees);
  }, [employeeData]);

  // Build `where1` for aggregates: include date range and category when set
  const whereBill = useMemo(() => {
    const w = {};
    if (!fromDate && toDate) {
      w.date = { _eq: toDate };
    }
    // only add date filter when both fromDate and toDate are present
    if (fromDate && toDate) {
      w.date = { _gte: fromDate, _lte: toDate };
    }

    return w;
  }, [fromDate, toDate]);

  // FETCH EXPENSES AND AGGREGATES (server-side filtering)
  const { data: expenseData, refetch: expenseRefetch } = useQuery(
    GET_EXPENSE_CATEGORIES_AGGREGATE,
    {
      variables: { whereBill },
      // fetchPolicy: "network-only",
    }
  );

  const expenseCategories = expenseData?.expense_categories || [];

  useEffect(() => {
    if (!expenseData) return;
    // process expenseData to setExpenses if needed
    const newExpenses = expenseCategories.map((cat) => ({
      id: cat.id,
      category: cat.category,
      advance: cat.expense_bills_aggregate?.aggregate?.sum?.advance || 0,
      amount: cat.expense_bills_aggregate?.aggregate?.sum?.amount || 0,
    }));
    setExpenses(newExpenses);
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

  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);

  const handleSaveExpense = async () => {
    if (!newExpense.category || !newExpense.amount) return;

    const insertObject = {
      expense_emp_id: newExpense.person || null,
      category: newExpense.category,
      advance: 0,
      amount: Number(newExpense.amount),
      remaining_amount: 0,
      payment_status: "partial",
      description: newExpense.description || null,
      bhada_details:
        newExpense.category === "Bhada"
          ? {
              vehicle: newExpense.vehicle,
              modi: newExpense.modi,
              item: newExpense.item,
            }
          : null,
      date: formatDate(today),
    };

    // Call the mutation to insert expense bill
    const [data, error] = await promiseResolver(
      insertExpensebill({
        variables: {
          objects: insertObject,
        },
        onCompleted: () => {
          client.cache.evict({ fieldName: "expense_categories" });
          client.cache.evict({ fieldName: "expense_expense_bills_aggregate" });

          client.cache.gc();
        },
      })
    );

    if (error) {
      console.error("Error inserting expense bill:", error);
    }
    setNewExpense({
      category: "Food",
      description: "",
      person: "",
      vehicle: "",
      modi: "",
      item: "",
      amount: "",
      date: "",
    });
    setIsModalOpen(false);
    expenseRefetch();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Expense Dashboard</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold shadow hover:bg-emerald-700 transition"
        >
          <Plus className="w-5 h-5" /> Add Expense
        </button>
      </div>

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

      {/* Summary */}
      <motion.div
        whileHover={{ y: -2 }}
        className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6 mb-6 flex justify-between items-center"
      >
        <div>
          <p className="text-gray-500 text-sm">Total Expense</p>
          <h2 className="text-2xl font-bold text-red-600">₹{totalAmount}</h2>
        </div>
      </motion.div>

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
            onClick={() =>
              navigate(
                `/expense/${encodeURIComponent(exp.category.toLowerCase())}`,
                {
                  state: { expense: exp },
                }
              )
            }
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
                {/* <span className="text-sm text-gray-500">
                  {new Date(exp.date).toLocaleDateString()}
                </span> */}
              </div>

              {/* Details */}
              <div className="space-y-1 text-sm text-gray-600">
                {exp.person && (
                  <p>
                    👤 <span className="font-medium">{exp.person}</span>
                  </p>
                )}
                {exp.vehicle && (
                  <p>
                    🚚 Vehicle:{" "}
                    <span className="font-medium">{exp.vehicle}</span>
                  </p>
                )}
                {exp.modi && (
                  <p>
                    🏬 Supplier: <span className="font-medium">{exp.modi}</span>
                  </p>
                )}
                {exp.item && (
                  <p>
                    📦 Item: <span className="font-medium">{exp.item}</span>
                  </p>
                )}
                {exp.description && (
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

      {isModalOpen && (
        <dialog open className="modal modal-open">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="modal-box max-w-md rounded-2xl p-6 bg-white shadow-xl border border-gray-200"
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg text-gray-800">
                Add New Expense
              </h3>
              <span
                className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                  categoryColors[newExpense.category]
                }`}
              >
                {newExpense.category}
              </span>
            </div>

            {/* Form */}
            <div className="space-y-3">
              <select
                className="w-full px-3 py-2 text-gray-700 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-emerald-200"
                value={newExpense.category}
                onChange={(e) =>
                  setNewExpense({ ...newExpense, category: e.target.value })
                }
              >
                {[
                  "Food",
                  "Repair",
                  "Commission",
                  "Salary",
                  "Bhada",
                  "Market Fee",
                ].map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>

              {/* Dynamic Fields */}
              {["Food", "Repair"].includes(newExpense.category) && (
                <input
                  type="text"
                  placeholder="Description"
                  className="w-full px-3 py-2 text-gray-700 rounded-lg border border-gray-300 shadow-sm"
                  value={newExpense.description}
                  onChange={(e) =>
                    setNewExpense({
                      ...newExpense,
                      description: e.target.value,
                    })
                  }
                />
              )}

              {["Commission", "Salary"].includes(newExpense.category) && (
                <select
                  className="w-full px-3 py-2 text-gray-700 rounded-lg border border-gray-300 shadow-sm focus:ring-2 focus:ring-emerald-200"
                  value={newExpense.person || ""}
                  onChange={(e) =>
                    setNewExpense({ ...newExpense, person: e.target.value })
                  }
                >
                  <option value="">-- Select Employee --</option>
                  {employeesList?.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              )}

              {newExpense.category === "Bhada" && (
                <>
                  <input
                    type="text"
                    placeholder="Vehicle Number"
                    className="w-full px-3 py-2 text-gray-700 rounded-lg border border-gray-300 shadow-sm"
                    value={newExpense.vehicle}
                    onChange={(e) =>
                      setNewExpense({ ...newExpense, vehicle: e.target.value })
                    }
                  />
                  <input
                    type="text"
                    placeholder="Modi / Supplier"
                    className="w-full px-3 py-2 text-gray-700 rounded-lg border border-gray-300 shadow-sm"
                    value={newExpense.modi}
                    onChange={(e) =>
                      setNewExpense({ ...newExpense, modi: e.target.value })
                    }
                  />
                  <input
                    type="text"
                    placeholder="Item"
                    className="w-full px-3 py-2 text-gray-700 rounded-lg border border-gray-300 shadow-sm"
                    value={newExpense.item}
                    onChange={(e) =>
                      setNewExpense({ ...newExpense, item: e.target.value })
                    }
                  />
                </>
              )}

              <input
                type="number"
                placeholder="Amount"
                className="w-full px-3 py-2 text-gray-700 rounded-lg border border-gray-300 shadow-sm"
                value={newExpense.amount}
                onChange={(e) =>
                  setNewExpense({ ...newExpense, amount: e.target.value })
                }
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 mt-5">
              <button
                className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold hover:bg-emerald-700 transition"
                onClick={handleSaveExpense}
              >
                Save
              </button>
            </div>
          </motion.div>
        </dialog>
      )}
    </div>
  );
};

export default ExpensePage;
