/* eslint-disable no-unused-vars */
import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const ConfirmedItemsDropdown = ({ confirmedItems }) => {
  const [open, setOpen] = useState(false); // collapsed by default ✅

  return (
    <div className="mb-6 bg-white shadow-md rounded-2xl border border-gray-200">
      {/* Header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex justify-between items-center px-6 py-4 text-left font-bold text-gray-900"
      >
        Confirmed Items
        {open ? (
          <ChevronUp className="w-5 h-5 text-gray-600" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-600" />
        )}
      </button>

      {/* Dropdown Content */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="px-6 py-4"
          >
            {Object.keys(confirmedItems).length === 0 ? (
              <p className="text-gray-500 italic">No items yet</p>
            ) : (
              Object.entries(confirmedItems).map(([modi, items]) => (
                <div
                  key={modi}
                  className="mb-6 p-4 bg-indigo-50 rounded-xl border border-indigo-100 shadow-sm"
                >
                  <h3 className="font-semibold text-indigo-700 mb-3">
                    Modi: {modi}
                  </h3>
                  <ul className="space-y-2">
                    {items.map((item) => (
                      <li
                        key={item.id}
                        className="flex justify-between items-center px-4 py-2 bg-white rounded-lg border border-gray-200 shadow-sm"
                      >
                        <span className="text-gray-800 font-medium">
                          {item.name}
                        </span>
                        <span className="text-gray-600 text-sm">
                          {item.quantity} {item.unit}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ConfirmedItemsDropdown;
