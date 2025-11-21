import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { X } from "lucide-react";

// Redesigned Summary Modal Component
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
      if (!acc[it.modi_name]) acc[it.modi_name] = [];
      acc[it.modi_name].push({ ...it, _idx: idx });
      return acc;
    }, {});
  }, [items]);

  const total = items.reduce((s, it) => s + (it.qty || 0) * (it.rate || 0), 0);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-50">
      <div className="bg-white w-[440px] p-6 rounded-2xl shadow-xl max-h-[85vh] overflow-y-auto relative">
        <button
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
          onClick={() => setIsOpen(false)}
        >
          <X size={20} />
        </button>

        <h3 className="text-xl font-bold mb-4 text-gray-800">Summary</h3>

        <label className="flex items-center gap-2 mb-4">
          <input
            type="checkbox"
            checked={openAll}
            onChange={() => setOpenAll(!openAll)}
            className="accent-indigo-600"
          />
          <span className="text-sm text-gray-700">Open all</span>
        </label>

        <div className="space-y-4">
          {Object.keys(grouped).length === 0 && (
            <p className="text-sm text-gray-500">No items.</p>
          )}

          {Object.entries(grouped).map(([modi, arr]) => (
            <details
              key={modi}
              open={openAll}
              className="rounded-xl border p-3 bg-gray-50"
            >
              <summary className="font-semibold cursor-pointer text-gray-800">
                {modi}
              </summary>

              <div className="ml-3 mt-3 space-y-3">
                {arr.map((it) => (
                  <div
                    key={it._idx}
                    className="flex justify-between items-center text-sm bg-white p-3 rounded-lg shadow"
                  >
                    <div>
                      <div className="font-medium text-gray-800">
                        {it.item_name}
                      </div>
                      <div className="text-xs text-gray-500">
                        {it.qty} × {it.rate} = ₹{it.qty * it.rate}
                      </div>
                    </div>

                    <button
                      className="text-xs text-red-500 hover:underline"
                      onClick={() => onDeleteItem?.(it._idx)}
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </details>
          ))}
        </div>

        <div className="border-t pt-4 mt-6 text-right text-lg font-semibold text-gray-800">
          Total: <span className="text-indigo-600">₹{total}</span>
        </div>

        <div className="mt-5 flex gap-3">
          <button
            className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300"
            onClick={() => setIsOpen(false)}
          >
            Close
          </button>
          <button
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 ml-auto"
            onClick={() => setIsOpen(false)}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default SummaryModal;
