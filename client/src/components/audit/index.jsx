import { useQuery } from "@apollo/client/react";
import React, { useMemo, useState } from "react";
import { FETCH_AUDIT_DATA } from "../../graphql/query";
import { promiseResolver } from "../../utils/promisResolver";
import api from "../../lib/axios";
import { formatDate } from "../../utils/time";
import DateFilter from "../dateFilter";

const today = new Date();

const auditHeader = [
  { key: "date", label: "Date" },
  { key: "opening_balance", label: "Opening Balance" },
  { key: "sales_amount", label: "Sales Amount" },
  { key: "borrowed_amount", label: "Borrowed Amount" },
  { key: "deposit_amount", label: "Deposit" },
  { key: "payment_amount", label: "Payments" },
  { key: "expense_amount", label: "Expenses" },
  { key: "closing_balance", label: "Closing Balance" },
];

const Audit = () => {
  const [fromDate, setFromDate] = useState(
    formatDate(new Date(today.getFullYear(), today.getMonth(), 1)),
  );
  const [toDate, setToDate] = useState(formatDate(today));
  const [isUpserting, setIsUpserting] = useState(false);

  const where = useMemo(() => {
    if (fromDate && toDate)
      return { audit_date: { _gte: fromDate, _lte: toDate } };
    if (toDate) return { audit_date: { _eq: toDate } };
    return {};
  }, [fromDate, toDate]);

  const {
    data: auditData,
    loading: auditLoading,
    error: auditError,
    refetch,
  } = useQuery(FETCH_AUDIT_DATA, {
    variables: { where, order_by: { audit_date: "desc" } },
  });

  // Defensive: sort newest-first regardless of what the API returns,
  // since handleFetchOpeningBalance's logic depends on this ordering.
  const sortedAudit = useMemo(() => {
    const rows = auditData?.audit ?? [];
    return [...rows].sort(
      (a, b) => new Date(b.audit_date) - new Date(a.audit_date),
    );
  }, [auditData]);

  const tableRows = useMemo(
    () =>
      sortedAudit.map((audit) => ({
        date: audit.audit_date,
        opening_balance: audit.opening_balance,
        sales_amount: audit.sales_amount,
        borrowed_amount: audit.borrowed_amount,
        deposit_amount: audit.deposit_amount,
        payment_amount: audit.payment_amount,
        expense_amount: audit.expense_amount,
        closing_balance: audit.closing_balance,
      })),
    [sortedAudit],
  );

  const handleFetchOpeningBalance = () => {
    if (isUpserting) return; // guard against double-submit

    const isTodayAlreadyLogged =
      sortedAudit[0]?.audit_date === formatDate(today);
    const latestAudit = isTodayAlreadyLogged ? sortedAudit[1] : sortedAudit[0];

    if (!latestAudit) {
      alert("No audit data available to fetch opening balance.");
      return;
    }

    const openingBalance = latestAudit.closing_balance;

    const upsertOpeningBalance = async () => {
      setIsUpserting(true);
      const [, error] = await promiseResolver(
        api.post("/api/v1/opening/opening-balance", { openingBalance }),
      );
      setIsUpserting(false);

      if (error) {
        console.error("Error fetching opening balance:", error);
        alert("Failed to update opening balance. Please try again.");
        return;
      }

      refetch();
    };

    upsertOpeningBalance();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 pt-4">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Audit</h1>
      </div>

      <div className="flex justify-between items-center">
        <div className="flex flex-wrap gap-3 mb-6 items-center">
          <DateFilter
            toDate={toDate}
            setToDate={setToDate}
            fromDate={fromDate}
            setFromDate={setFromDate}
          />
        </div>
        <div className="flex justify-end mb-6">
          <button
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg shadow-sm hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleFetchOpeningBalance}
            disabled={isUpserting}
          >
            {isUpserting ? "Fetching..." : "Fetch opening balance"}
          </button>
        </div>
      </div>

      {auditLoading && <p>Loading...</p>}
      {!auditLoading && auditError && <p>Error: {auditError.message}</p>}
      {!auditLoading && !auditError && (
        <div className="overflow-x-auto">
          <table className="table">
            <thead>
              <tr>
                {auditHeader.map((header) => (
                  <th key={header.key}>{header.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row) => (
                <tr key={row.date}>
                  {auditHeader.map((header) => (
                    <td key={header.key}>{row[header.key] || 0}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Audit;
