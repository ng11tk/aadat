import React, { useState } from "react";
import { formatDate } from "../utils/time";
import { useLocation } from "react-router-dom";

const DateFilter = ({ fromDate, setFromDate, toDate, setToDate }) => {
  const today = new Date();
  const location = useLocation();

  const selectButtonColor =
    location.pathname.includes(["/expense"]) ||
    location.pathname.includes(["/audit"])
      ? "emerald"
      : "indigo";

  const [filterMode, setFilterMode] = useState("thisMonth");
  const dateRangeOptions = [
    { key: "today", label: "Today" },
    { key: "thisWeek", label: "This Week" },
    { key: "thisMonth", label: "This Month" },
    { key: "custom", label: "Custom" },
  ];

  // filter
  const applyQuickFilter = (mode) => {
    setFilterMode(mode);
    if (mode === "today") {
      const d = formatDate(today);
      setFromDate(d);
      setToDate(d);
    } else if (mode === "thisWeek") {
      const firstDayOfWeek = new Date(today);
      firstDayOfWeek.setDate(today.getDate() - today.getDay());
      setFromDate(formatDate(firstDayOfWeek));
      setToDate(formatDate(today));
    } else if (mode === "thisMonth") {
      setFromDate(
        formatDate(new Date(today.getFullYear(), today.getMonth(), 1)),
      );
      setToDate(formatDate(today));
    }
  };

  return (
    <div className="flex-auto flex items-center gap-2 flex-wrap">
      <div className="flex gap-2">
        {dateRangeOptions.map((mode) => (
          <button
            key={mode.key}
            onClick={() => applyQuickFilter(mode.key)}
            className={`px-3 py-1 rounded-md text-sm font-medium transition ${
              filterMode === mode.key
                ? `bg-${selectButtonColor}-600 text-white`
                : "bg-gray-50 text-gray-700 border border-gray-200 hover:bg-emerald-50"
            }`}
          >
            {mode.label}
          </button>
        ))}
      </div>

      {filterMode === "custom" && (
        <div className="flex gap-2">
          <input
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="px-2 py-1 rounded-md border border-gray-300 text-sm"
          />
          <input
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="px-2 py-1 rounded-md border border-gray-300 text-sm"
          />
        </div>
      )}
    </div>
  );
};

export default DateFilter;
