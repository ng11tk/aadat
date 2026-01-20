import React, { useState } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";

const ExpenseModal = ({ onClose, onSubmit }) => {
  const [form, setForm] = useState({
    type: "food",
    details: "",
    amount: "",
  });

  const getDetailsLabel = () => {
    switch (form.type) {
      case "salary":
        return "Employee Name";
      case "commission":
        return "Agent Name";
      case "repair":
        return "Repair Details";
      case "advance":
        return "Advance To";
      case "bhada":
        return "Vehicle / Supplier";
      case "market_fee":
        return "Market Fee Details";
      default:
        return "Details";
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.amount) return;
    onSubmit(form);
    setForm({ type: "food", details: "", amount: "" });
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-2xl shadow-lg p-6 w-full max-w-md relative"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-700"
        >
          <X className="w-5 h-5" />
        </button>

        <h2 className="text-xl font-bold text-gray-900 mb-4">Add Expense</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Expense Type */}
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-indigo-400 focus:outline-none"
          >
            <option value="food">Food</option>
            <option value="repair">Repair</option>
            <option value="commission">Commission</option>
            <option value="salary">Salary</option>
            <option value="advance">Advance</option>
            <option value="bhada">Bhada</option>
            <option value="market_fee">Market Fee</option>
          </select>

          {/* Dynamic Details */}
          <input
            type="text"
            placeholder={getDetailsLabel()}
            value={form.details}
            onChange={(e) => setForm({ ...form, details: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-400 focus:outline-none"
          />

          {/* Amount */}
          <input
            type="number"
            placeholder="Enter amount"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-400 focus:outline-none"
          />

          {/* Actions */}
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 transition"
            >
              Save Expense
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default ExpenseModal;
