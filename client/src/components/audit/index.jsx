import { useQuery } from "@apollo/client/react";
import React, { useMemo, useState } from "react";
import { FETCH_AUDIT_DATA } from "../../graphql/query";
import { promiseResolver } from "../../utils/promisResolver";
import axios from "axios";
import api from "../../lib/axios";

const today = new Date();
const formatDate = (date) => date.toISOString().split("T")[0];

const auditHeader = [
  { key: "date", label: "Date" },
  { key: "opening_balance", label: "Opening Balance" },
  // { key: "opening_borrowed", label: "Opening Borrowed" },
  { key: "sales_amount", label: "Sales Amount" },
  { key: "borrowed_amount", label: "Borrowed Amount" },
  { key: "deposit", label: "Deposit" },
  { key: "expenses", label: "Expenses" },
  { key: "payments", label: "Payments" },
  { key: "closing_balance", label: "Closing Balance" },
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
      w.audit_date = { _eq: toDate };
    }
    // only add audit_date filter when both fromDate and toDate are present
    if (fromDate && toDate) {
      w.audit_date = { _gte: fromDate, _lte: toDate };
    }

    return w;
  }, [fromDate, toDate]);

  // fetch sales aggregate data based on the where filter
  const {
    data: auditData,
    loading: auditLoading,
    error: auditError,
    refetch,
  } = useQuery(FETCH_AUDIT_DATA, {
    variables: { where },
  });

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

  const mapAuditDataToTable = (data) => {
    if (!data || !data.audit) return [];
    return data.audit.map((audit, index) => ({
      key: index + 1,
      date: audit.audit_date,
      opening_balance: audit.opening_balance,
      // { key: "opening_borrowed", label: "Opening Borrowed" },
      sales_amount: audit.sales_amount,
      borrowed_amount: audit.borrowed_amount,
      deposit_amount: audit.deposit_amount,
      expense_amount: audit.expense_amount,
      payment_amount: audit.payment_amount,
      closing_balance: audit.closing_balance,
    }));
  };

  // handle fetch opening balance
  const handleFetchOpeningBalance = () => {
    // upsert opening balance in opening balance table based on the latest audit data

    //* check if opening balance already exist in database or not
    const isOpeningBalanceExist =
      auditData?.audit?.[0]?.audit_date === formatDate(today);

    const latestAudit = isOpeningBalanceExist
      ? auditData?.audit?.[1]
      : auditData?.audit?.[0];

    if (!latestAudit) {
      alert("No audit data available to fetch opening balance.");
      return;
    }

    // fetch opening balance from the latest audit data
    const openingBalance = latestAudit.closing_balance;
    // upsert opening balance in opening balance table

    const upsertOpeningBalance = async () => {
      const [response, error] = await promiseResolver(
        api.post("/api/v1/opening/opening-balance", { openingBalance }),
      );

      if (error) {
        console.error("Error fetching opening balance:", error);
      }

      refetch();
    };

    upsertOpeningBalance();

    // alert(`Opening balance of ${openingBalance} fetched successfully.`);
  };

  if (auditLoading) return <p>Loading...</p>;
  if (auditError) return <p>Error: {auditError.message}</p>;

  return (
    <div className="min-h-screen bg-gray-50 p-6 pt-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Audit</h1>
      </div>{" "}
      <div className="flex justify-between items-center">
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
        <div className="flex justify-end mb-6">
          <button
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg shadow-sm hover:bg-emerald-700"
            onClick={handleFetchOpeningBalance}
          >
            fetch opening balance
          </button>
        </div>
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
            {mapAuditDataToTable(auditData).map((row) => (
              <tr key={row.key}>
                <td>{row.date}</td>
                <td>{row.opening_balance || 0}</td>
                <td>{row.sales_amount || 0}</td>
                <td>{row.borrowed_amount || 0}</td>
                <td>{row.deposit_amount || 0}</td>
                <td>{row.expense_amount || 0}</td>
                <td>{row.payment_amount || 0}</td>
                <td>{row.closing_balance || 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Audit;
