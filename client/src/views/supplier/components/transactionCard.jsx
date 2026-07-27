import React from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Clock, ChevronRight } from "lucide-react";

const TransactionCard = ({
  setModalTransaction,
  transaction,
  selectedTransactions,
  setSelectedTransactions,
  updateTransaction,
}) => {
  const selection = selectedTransactions[transaction.id];
  const isSelected = Boolean(selection);
  const isPaid = transaction.due === 0;

  const clampAmount = (value, due) => {
    if (Number.isNaN(value)) return 0;
    return Math.min(Math.max(value, 0), due);
  };

  const savePartial = (id, amount, due) => {
    if (!amount || amount <= 0) return;
    if (amount >= due) {
      updateTransaction(id, "full");
    } else {
      setSelectedTransactions((prev) => ({
        ...prev,
        [id]: { ...prev[id], mode: "partial", amount, finalized: true },
      }));
    }
  };

  return (
    <motion.div
      layout
      whileHover={!isPaid ? { y: -4 } : {}}
      className={`relative rounded-lg overflow-hidden border transition cursor-pointer group ${
        isPaid
          ? "bg-emerald-50 border-emerald-200"
          : isSelected
            ? "bg-white border-indigo-400 ring-2 ring-indigo-200 shadow-md"
            : "bg-white border-gray-200 hover:shadow-lg"
      }`}
      onClick={() => setModalTransaction(transaction)}
    >
      {/* Top Color Accent */}
      <div
        className={`h-1 ${isPaid ? "bg-emerald-500" : isSelected ? "bg-indigo-500" : "bg-gray-300"}`}
      />

      <div className="p-5">
        {/* Header with Status */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-500 mb-1">
              {new Date(transaction.date).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
            <p className="text-lg font-bold text-gray-900">
              ₹{(transaction.total || 0).toLocaleString()}
            </p>
          </div>

          {/* Status Badge */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
              isPaid
                ? "bg-emerald-100 text-emerald-700"
                : isSelected
                  ? "bg-indigo-100 text-indigo-700"
                  : "bg-amber-100 text-amber-700"
            }`}
          >
            {isPaid ? (
              <CheckCircle2 className="h-3.5 w-3.5" />
            ) : (
              <Clock className="h-3.5 w-3.5" />
            )}
            {isPaid ? "Paid" : isSelected ? "Selected" : "Pending"}
          </div>
        </div>

        {/* Due Amount */}
        {!isPaid && (
          <div className="bg-gray-50 rounded-lg p-3 mb-4">
            <p className="text-xs text-gray-600 mb-1">Due Amount</p>
            <p className="text-2xl font-bold text-red-600">
              ₹{(transaction.due || 0).toLocaleString()}
            </p>
          </div>
        )}

        {/* Payment Actions */}
        {!isPaid && (
          <>
            <div className="space-y-3 mb-4">
              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2">
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    updateTransaction(transaction.id, "full");
                  }}
                  className={`px-4 py-2.5 rounded-lg font-medium text-sm transition ${
                    selection?.mode === "full"
                      ? "bg-indigo-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Full Pay
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    updateTransaction(
                      transaction.id,
                      "partial",
                      selection?.amount || 0,
                    );
                  }}
                  className={`px-4 py-2.5 rounded-lg font-medium text-sm transition ${
                    selection?.mode === "partial"
                      ? "bg-amber-500 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  Partial
                </motion.button>
              </div>

              {/* Partial Amount Input */}
              {selection?.mode === "partial" && !selection?.finalized && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex gap-2"
                >
                  <input
                    type="number"
                    min={0}
                    max={transaction.due}
                    value={selection?.amount ?? ""}
                    onChange={(e) => {
                      const raw = Number(e.target.value);
                      const clamped = clampAmount(raw, transaction.due);
                      setSelectedTransactions((prev) => ({
                        ...prev,
                        [transaction.id]: {
                          ...prev[transaction.id],
                          amount: clamped,
                        },
                      }));
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="Enter amount"
                    aria-label="Partial payment amount"
                    onClick={(e) => e.stopPropagation()}
                  />
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      savePartial(
                        transaction.id,
                        selection?.amount,
                        transaction.due,
                      );
                    }}
                    className="px-4 py-2 bg-amber-500 text-white rounded-lg font-medium text-sm hover:bg-amber-600 transition"
                  >
                    ✓
                  </motion.button>
                </motion.div>
              )}

              {/* Finalized Partial Amount */}
              {selection?.mode === "partial" && selection?.finalized && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-xs text-amber-700 font-medium">
                    Partial Payment: ₹{(selection.amount || 0).toLocaleString()}
                  </p>
                </div>
              )}
            </div>

            {/* View Details CTA */}
            <div className="flex items-center justify-between text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity pt-3 border-t border-gray-100">
              <span className="text-xs font-semibold">View Items</span>
              <ChevronRight className="w-4 h-4" />
            </div>
          </>
        )}

        {/* Paid State CTA */}
        {isPaid && (
          <div className="flex items-center justify-between text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity pt-3 border-t border-emerald-100">
            <span className="text-xs font-semibold">View Details</span>
            <ChevronRight className="w-4 h-4" />
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default TransactionCard;
