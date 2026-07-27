import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";

const ItemDetails = ({ setModalTransaction, modalTransaction }) => {
  const items = modalTransaction?.items ?? [];

  const total = items.reduce(
    (sum, i) => sum + (Number(i.qty) || 0) * (Number(i.rate) || 0),
    0,
  );

  // Close on Escape
  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") setModalTransaction(null);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [setModalTransaction]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
      onClick={() => setModalTransaction(null)}
      role="dialog"
      aria-modal="true"
      aria-label="Transaction items"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-xl shadow-lg w-96 max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-lg text-gray-800">
            Transaction Items
          </h3>
          <button
            onClick={() => setModalTransaction(null)}
            className="text-gray-400 hover:text-gray-600 transition"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Item list */}
        <div className="px-6 py-4 overflow-y-auto flex-1">
          {items.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">
              No items found for this transaction.
            </p>
          ) : (
            items.map((i, idx) => (
              <div
                key={i.id ?? `${i.name}-${idx}`}
                className="flex justify-between mb-2"
              >
                <span className="text-gray-700">
                  {i.name || "Unnamed item"} x {i.qty ?? 0}
                </span>
                <span className="font-semibold text-gray-900">
                  ₹{((Number(i.qty) || 0) * (Number(i.rate) || 0)).toFixed(2)}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Total + close */}
        <div className="px-6 py-4 border-t border-gray-100">
          {items.length > 0 && (
            <div className="flex justify-between mb-4 font-semibold text-gray-900">
              <span>Total</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
          )}
          <button
            className="btn btn-primary w-full"
            onClick={() => setModalTransaction(null)}
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default ItemDetails;
