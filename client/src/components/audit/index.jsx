import { useQuery } from "@apollo/client/react";
import React, { useMemo, useState } from "react";
import { FETCH_SALES_AGGREGATE } from "../../graphql/query";

const today = new Date();
const formatDate = (date) => date.toISOString().split("T")[0];

const auditHeader = [
  { key: "date", label: "Date" },
  { key: "opening_cash", label: "Opening Cash" },
  { key: "opening_borrowed", label: "Opening Borrowed" },
  { key: "total_amount", label: "Sales Amount" },
  { key: "borrowed_amount", label: "Borrowed Amount" },
  { key: "deposit", label: "Deposit" },
  { key: "expenses", label: "Expenses" },
  { key: "payments", label: "Payments" },
  { key: "closing_cash", label: "Closing Cash" },
];

const Audit = () => {
  const [fromDate, setFromDate] = useState(
    formatDate(new Date(today.getFullYear(), today.getMonth(), 1)),
  );
  const [toDate, setToDate] = useState(formatDate(today));
  const [filterMode, setFilterMode] = useState("thisMonth");

  const where = useMemo(() => {
    const w = {};
    if (!fromDate && toDate) {
      w.order_date = { _eq: toDate };
    }
    // only add order_date filter when both fromDate and toDate are present
    if (fromDate && toDate) {
      w.order_date = { _gte: fromDate, _lte: toDate };
    }

    return w;
  }, [fromDate, toDate]);
  console.log("🚀 ~ Audit ~ where:", where);

  // fetch sales aggregate data based on the where filter
  const {
    data: salesData,
    loading: salesLoading,
    error: salesError,
  } = useQuery(FETCH_SALES_AGGREGATE, {
    variables: { where },
  });
  console.log("🚀 ~ Audit ~ salesData:", salesData);

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
        formatDate(new Date(today.getFullYear(), today.getMonth(), 1)),
      );
      setToDate(formatDate(today));
    }
  };

  if (salesLoading) return <p>Loading...</p>;
  if (salesError) return <p>Error: {salesError.message}</p>;

  return (
    <div className="min-h-screen bg-gray-50 p-6 pt-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Audit</h1>
      </div>{" "}
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
      {/* Audit Table */}
      <div className="overflow-x-auto">
        <table className="table">
          {/* head */}
          <thead>
            <tr>
              {auditHeader.map((header) => (
                <th key={header.key}>{header.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* row 1 */}
            <tr>
              <th>1</th>
              <td>Cy Ganderton</td>
              <td>Quality Control Specialist</td>
              <td>Blue</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Audit;
