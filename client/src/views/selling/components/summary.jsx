import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { X, ChevronRight, ShoppingBag } from "lucide-react";
import {
  calculateLineTotal,
  calculateOrderTotal,
} from "../../../utils/salesPricing";

const SummaryModal = ({ items = [], onDeleteItem, openById }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [openAll, setOpenAll] = useState(false);

  useEffect(() => {
    const btn = openById ? document.getElementById(openById) : null;
    if (!btn) return;
    const handler = () => setIsOpen(true);
    btn.addEventListener("click", handler);
    return () => btn.removeEventListener("click", handler);
  }, [openById]);

  const grouped = useMemo(() => {
    return items.reduce((acc, it, idx) => {
      const groupKey = it.modi_name || "Other";
      if (!acc[groupKey]) acc[groupKey] = [];
      acc[groupKey].push({ ...it, _idx: idx });
      return acc;
    }, {});
  }, [items]);

  const total = useMemo(() => calculateOrderTotal(items), [items]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl max-h-[85vh] overflow-hidden"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Sale Summary</h3>
            <p className="text-sm text-gray-500">
              Review items before submitting
            </p>
          </div>
        </div>

        <div className="px-6 py-5 overflow-y-auto max-h-[60vh]">
          <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 mb-4">
            <div className="flex items-center gap-2 text-gray-700">
              <ShoppingBag className="w-4 h-4 text-indigo-600" />
              <span className="text-sm font-medium">
                {items.length} item(s)
              </span>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={openAll}
                onChange={() => setOpenAll(!openAll)}
                className="accent-indigo-600"
              />
              Open all
            </label>
          </div>

          <div className="space-y-3">
            {Object.keys(grouped).length === 0 && (
              <div className="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500">
                No items selected yet.
              </div>
            )}

            {Object.entries(grouped).map(([modi, arr]) => (
              <details
                key={modi}
                open={openAll}
                className="rounded-xl border border-gray-200 bg-gray-50 overflow-hidden"
              >
                <summary className="flex items-center justify-between cursor-pointer px-4 py-3 font-semibold text-gray-800">
                  <span>{modi}</span>
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                </summary>

                <div className="px-3 pb-3 pt-1 space-y-2">
                  {arr.map((it) => {
                    const lineTotal = calculateLineTotal(it);
                    return (
                      <div
                        key={it._idx}
                        className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-3"
                      >
                        <div>
                          <div className="font-medium text-gray-800">
                            {it.item_name}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            Weight: {it.weight || 0} | Qty: {it.qty || 0} |
                            Rate: ₹{it.rate || 0} | Type:{" "}
                            {it.rate_type === "quantity" ? "Qty" : "Weight"}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-gray-900">
                            ₹{lineTotal.toLocaleString()}
                          </div>
                          <button
                            className="text-xs text-red-500 hover:text-red-700 mt-1"
                            onClick={() => onDeleteItem?.(it._idx)}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </details>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
          <div className="flex items-center justify-between text-lg font-semibold text-gray-900">
            <span>Total</span>
            <span className="text-indigo-600">₹{total.toLocaleString()}</span>
          </div>
          <div className="mt-4 flex gap-3 justify-end">
            <button
              className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
              onClick={() => setIsOpen(false)}
            >
              Close
            </button>
            {/* <button
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition"
              onClick={() => setIsOpen(false)}
            >
              Done
            </button> */}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SummaryModal;
