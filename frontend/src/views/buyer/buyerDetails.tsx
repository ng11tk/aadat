import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";

const formatDate = (date: Date) => date.toISOString().split("T")[0];

const BuyerDetails = () => {
  const today = new Date();
  const location = useLocation();
  const buyerFromState = location.state?.buyer || {};
  const [buyer, setBuyer] = useState<any>({});
  const [transactions, setTransactions] = useState<any[]>([]);
  const [modalTransaction, setModalTransaction] = useState<any | null>(null);
  const [filterMode, setFilterMode] = useState("thisMonth");
  const [fromDate, setFromDate] = useState(
    formatDate(new Date(today.getFullYear(), today.getMonth(), 1))
  );
  const [toDate, setToDate] = useState(formatDate(today));
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    // populate buyer
    setBuyer(buyerFromState || {});

    // try to load transactions for this buyer from localStorage (key: sales)
    try {
      const sales = JSON.parse(localStorage.getItem("sales") || "[]");
      const filtered = sales.filter(
        (s: any) => s.buyer === (buyerFromState.name || buyerFromState.buyer)
      );
      // normalize transactions
      const t = filtered.map((s: any, idx: number) => ({
        id: s.id || Date.now() + idx,
        date: s.date || formatDate(new Date()),
        total: s.grandTotalAmount || s.total || 0,
        due: (s.grandTotalAmount || s.total || 0) - (s.paid || 0),
        items: (s.groups || []).flatMap((g: any) => g.items || []),
      }));
      setTransactions(t);
    } catch (err) {
      setTransactions([]);
    }
  }, [buyerFromState]);

  const applyQuickFilter = (mode: string) => {
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
        formatDate(new Date(today.getFullYear(), today.getMonth(), 1))
      );
      setToDate(formatDate(today));
    }
  };

  const filtered = transactions.filter((t) => {
    const d = new Date(t.date);
    const withinDate = d >= new Date(fromDate) && d <= new Date(toDate);
    const statusMatch =
      statusFilter === "all" ||
      (statusFilter === "paid" && t.due === 0) ||
      (statusFilter === "unpaid" && t.due > 0);
    return withinDate && statusMatch;
  });

  const [selectedTransactions, setSelectedTransactions] = useState<any>({});

  const updateTransactionSelection = (id: any, mode: any, amount = 0) => {
    const t = transactions.find((tr) => tr.id === id);
    if (!t || t.due === 0) return;
    setSelectedTransactions((prev: any) => {
      if (prev[id]?.mode === mode) {
        const newObj: any = { ...prev };
        delete newObj[id];
        return newObj;
      }
      return {
        ...prev,
        [id]: { mode, amount: mode === "full" ? t.due : amount },
      };
    });
  };

  const totalSelectedAmount = Object.values(selectedTransactions).reduce(
    (sum: number, t: any) => sum + (t.amount || 0),
    0
  );

  const confirmPayment = () => {
    // naive local update: subtract from due and persist to localStorage
    const updated = transactions.map((tr) => {
      const sel = selectedTransactions[tr.id];
      if (!sel) return tr;
      const amount = sel.amount || 0;
      return { ...tr, due: Math.max(0, tr.due - amount) };
    });
    setTransactions(updated);
    setSelectedTransactions({});
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen text-gray-900">
      <div className="mb-6 grid md:grid-cols-2 gap-4">
        <div className="bg-white shadow-md rounded-xl p-4 border border-gray-200">
          <h2 className="text-lg font-semibold mb-1">
            {buyer.name || buyer.buyer}
          </h2>
          <p className="text-gray-600 text-sm">
            📞 {buyer.contact || buyer.phone || "-"}
          </p>
        </div>
        <div className="bg-white shadow-md rounded-xl p-4 border border-gray-200 flex justify-around">
          <div className="text-center">
            <p className="text-gray-500 text-sm">Total Sale</p>
            <p className="font-semibold text-indigo-600">
              ₹{transactions.reduce((s, t) => s + (t.total || 0), 0)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-gray-500 text-sm">Due</p>
            <p className="font-semibold text-red-600">
              ₹{transactions.reduce((s, t) => s + (t.due || 0), 0)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-gray-500 text-sm">Advance</p>
            <p className="font-semibold text-indigo-600">₹0</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <div className="flex gap-2">
          {["today", "thisWeek", "thisMonth", "custom"].map((mode) => (
            <button
              key={mode}
              onClick={() => applyQuickFilter(mode)}
              className={`px-4 py-2 rounded-full border text-sm font-medium transition ${
                filterMode === mode
                  ? "bg-indigo-600 text-white"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-100"
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
        </div>

        {filterMode === "custom" && (
          <div className="flex gap-2">
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="input input-sm input-bordered bg-white"
            />
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="input input-sm input-bordered bg-white"
            />
          </div>
        )}

        <div className="flex gap-2 ml-auto">
          {["all", "paid", "unpaid"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-full border text-sm font-medium transition ${
                statusFilter === status
                  ? "bg-indigo-600 text-white"
                  : "bg-white border-gray-300 text-gray-700 hover:bg-gray-100"
              }`}
            >
              {status === "all" ? "All" : status === "paid" ? "Paid" : "Unpaid"}
            </button>
          ))}
        </div>
      </div>

      {/* Transactions Grid */}
      <div className="grid md:grid-cols-3 gap-4">
        {filtered.map((t) => {
          const info = selectedTransactions[t.id] || {
            mode: "full",
            amount: t.due,
          };
          const isPaid = t.due === 0;
          return (
            <motion.div
              key={t.id}
              layout
              whileHover={
                !isPaid
                  ? { y: -4, boxShadow: "0px 8px 16px rgba(0,0,0,0.1)" }
                  : {}
              }
              className={`relative rounded-xl p-5 shadow-md border transition cursor-pointer ${
                isPaid
                  ? "bg-gradient-to-r from-indigo-50 to-indigo-100 border-indigo-300"
                  : "bg-white border-gray-200"
              }`}
              onClick={() => setModalTransaction(t)}
            >
              <div className="absolute top-2 right-2">
                <span
                  className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    isPaid
                      ? "bg-indigo-600 text-white"
                      : "bg-yellow-500 text-white"
                  }`}
                >
                  {isPaid ? "Paid ✅" : "Unpaid ⚠️"}
                </span>
              </div>

              <p className="font-semibold text-gray-800">{t.date}</p>
              <p className="text-sm text-gray-600">Total: ₹{t.total}</p>
              <p className="text-sm font-medium text-red-600">Due: ₹{t.due}</p>

              {!isPaid && (
                <div className="mt-3 space-y-2">
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateTransactionSelection(t.id, "full");
                      }}
                      className={`flex-1 px-3 py-1 rounded-full text-sm font-medium ${
                        info.mode === "full"
                          ? "bg-indigo-500 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-indigo-100"
                      }`}
                    >
                      Full
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateTransactionSelection(
                          t.id,
                          "partial",
                          info.amount || 0
                        );
                      }}
                      className={`flex-1 px-3 py-1 rounded-full text-sm font-medium ${
                        info.mode === "partial"
                          ? "bg-yellow-400 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-yellow-100"
                      }`}
                    >
                      Partial
                    </button>
                  </div>
                  {info.mode === "partial" && (
                    <div className="flex gap-2 mt-2">
                      <input
                        type="number"
                        min={0}
                        max={t.due}
                        value={info.amount || ""}
                        onChange={(e) =>
                          setSelectedTransactions((prev: any) => ({
                            ...prev,
                            [t.id]: {
                              ...prev[t.id],
                              amount: Number(e.target.value),
                            },
                          }))
                        }
                        className="flex-1 input input-sm input-bordered bg-white"
                        placeholder="₹ Amount"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        className="btn btn-sm btn-primary"
                      >
                        ✔
                      </button>
                    </div>
                  )}
                  {info.mode === "partial" && info.finalized && (
                    <p className="text-xs mt-1 text-orange-600 font-medium">
                      Partial Paid: ₹{info.amount}
                    </p>
                  )}
                </div>
              )}
            </motion.div>
          );
        })}
      </div>

      {Object.keys(selectedTransactions).length > 0 && (
        <div className="mt-6 bg-white shadow rounded-xl p-4 flex justify-between items-center border border-gray-200">
          <span className="text-gray-700 font-medium">
            Total Selected Payable
          </span>
          <span className="text-xl font-bold text-indigo-600">
            ₹{totalSelectedAmount}
          </span>
          <button className="btn btn-primary" onClick={confirmPayment}>
            Confirm Payment
          </button>
        </div>
      )}

      <AnimatePresence>
        {modalTransaction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
            onClick={() => setModalTransaction(null)}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white rounded-xl shadow-lg p-6 w-96 max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-semibold text-lg mb-4">Transaction Items</h3>
              {modalTransaction.items.map((i: any, idx: number) => (
                <div key={idx} className="flex justify-between mb-2">
                  <span className="text-gray-700">
                    {i.name} x{i.quantity}
                  </span>
                  <span className="font-semibold text-gray-900">
                    ₹{(i.quantity * (i.rate || 0)).toFixed(2)}
                  </span>
                </div>
              ))}
              <button
                className="mt-4 btn btn-primary w-full"
                onClick={() => setModalTransaction(null)}
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default BuyerDetails;
