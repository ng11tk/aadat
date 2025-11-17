import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";
import { FETCH_SUPPLIER_DETAILS } from "../../graphql/query";
import { useMutation, useQuery } from "@apollo/client/react";
import { INSERT_SUPPLIER_TRANSACTION } from "../../graphql/mutation";
import { promiseResolver } from "../../utils/promisResolver";

const formatDate = (date) => date.toISOString().split("T")[0];

const SupplierDetails = () => {
  const today = new Date();
  const location = useLocation();
  const suppliers = location.state?.supplier || [];
  const [supplier, setSupplier] = useState<any>({});
  const [selectedTransactions, setSelectedTransactions] = useState({});
  const [modalTransaction, setModalTransaction] = useState(null);
  const [filterMode, setFilterMode] = useState("thisMonth");
  const [statusFilter, setStatusFilter] = useState("all"); // ✅ new filter
  const [fromDate, setFromDate] = useState(
    formatDate(new Date(today.getFullYear(), today.getMonth(), 1))
  );
  const [toDate, setToDate] = useState(formatDate(today));

  const [insertSupplierTransactions] = useMutation(INSERT_SUPPLIER_TRANSACTION);

  // fetch supplier details
  const {
    error,
    data: { supplier_supplier: supplier_supplier = [] } = {},
    loading,
    refetch,
  } = useQuery(FETCH_SUPPLIER_DETAILS, {
    variables: {
      where: {
        id: { _eq: suppliers.id },
      },
    },
    fetchPolicy: "network-only",
  });

  // update supplier state when data changes
  useEffect(() => {
    if (supplier_supplier && supplier_supplier.length > 0) {
      const s = supplier_supplier[0];
      const formattedSupplier = {
        id: s.id,
        name: s.name,
        contact: s.phone,
        address: s.address,
        totalSale: s.supplier_unloadings_aggregate?.aggregate?.sum?.amount || 0,
        totalDue:
          s.supplier_unloadings_aggregate?.aggregate?.sum?.remaining_amount ||
          0,
        totalAdvance: 2000,
        transactions: s?.supplier_unloadings_aggregate?.nodes.map((t: any) => ({
          id: t.id,
          date: t.unloading_date,
          total: t.amount,
          due: t.remaining_amount,
          payment_status: t.payment_status,
          items: t.unloading.unloading_items.map((item: any) => ({
            id: item.id,
            name: item.item_name,
            qty: item.quantity,
            rate: item.rate,
            unit: item.unit,
          })),
        })),
      };

      setSupplier(formattedSupplier);
    }
  }, [supplier_supplier]);

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

  // ✅ Filter by date + status
  const filteredTransactions = supplier?.transactions?.filter((t: any) => {
    const d = new Date(t.date);
    const withinDate = d >= new Date(fromDate) && d <= new Date(toDate);
    const statusMatch =
      statusFilter === "all" ||
      (statusFilter === "paid" && t.due === 0) ||
      (statusFilter === "unpaid" && t.due > 0);
    return withinDate && statusMatch;
  });

  const updateTransaction = (id: any, mode: any, amount: number = 0) => {
    const t = supplier?.transactions?.find((tr: any) => tr.id === id);
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

  const savePartial = (id: any, amount: any, due: any) => {
    if (!amount || amount <= 0) return;
    if (amount >= due) {
      updateTransaction(id, "full");
    } else {
      setSelectedTransactions((prev: any) => ({
        ...prev,
        [id]: { ...prev[id], mode: "partial", amount, finalized: true },
      }));
    }
  };

  const handleUpdateSupplierPayments = async () => {
    const output = Object.entries(selectedTransactions).map(([id, value]) => {
      return { supplier_unloading_id: id, amount: value.amount };
    });

    const [data, error] = await promiseResolver(
      insertSupplierTransactions({
        variables: { objects: output },
      })
    );
    if (error) {
      console.error("Error inserting supplier transactions:", error);
      return;
    }
    setSelectedTransactions({});
    refetch();
  };

  if (loading) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen text-gray-900">
      {/* Supplier & Business Summary */}
      <div className="mb-6 grid md:grid-cols-2 gap-4">
        <div className="bg-white shadow-md rounded-xl p-4 border border-gray-200">
          <h2 className="text-lg font-semibold mb-1">{supplier.name}</h2>
          <p className="text-gray-600 text-sm">📞 {supplier.contact}</p>
        </div>
        <div className="bg-white shadow-md rounded-xl p-4 border border-gray-200 flex justify-around">
          <div className="text-center">
            <p className="text-gray-500 text-sm">Total Sale</p>
            <p className="font-semibold text-indigo-600">
              ₹{supplier.totalSale}
            </p>
          </div>
          <div className="text-center">
            <p className="text-gray-500 text-sm">Due</p>
            <p className="font-semibold text-red-600">₹{supplier.totalDue}</p>
          </div>
          <div className="text-center">
            <p className="text-gray-500 text-sm">Advance</p>
            <p className="font-semibold text-green-600">
              ₹{supplier.totalAdvance}
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {/* Date filters */}
        <div className="flex gap-2">
          {["today", "thisWeek", "thisMonth", "custom"].map((mode) => (
            <button
              key={mode}
              onClick={() => applyQuickFilter(mode)}
              className={`px-4 py-2 rounded-full border text-sm font-medium transition ${
                filterMode === mode
                  ? "bg-indigo-600 text-white border-indigo-600 shadow"
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

        {/* Custom Date Range */}
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

        {/* Status Filter */}
        <div className="flex gap-2 ml-auto">
          {["all", "paid", "unpaid"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-full border text-sm font-medium transition ${
                statusFilter === status
                  ? status === "paid"
                    ? "bg-green-600 text-white border-green-600 shadow"
                    : status === "unpaid"
                    ? "bg-red-500 text-white border-red-500 shadow"
                    : "bg-indigo-600 text-white border-indigo-600 shadow"
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
        {filteredTransactions?.map((t) => {
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
                  ? "bg-gradient-to-r from-green-50 to-green-100 border-green-300"
                  : "bg-white border-gray-200"
              }`}
              onClick={() => setModalTransaction(t)}
            >
              {/* Status Tag */}
              <div className="absolute top-2 right-2">
                <span
                  className={`px-3 py-1 text-xs font-semibold rounded-full ${
                    isPaid
                      ? "bg-green-600 text-white"
                      : "bg-yellow-500 text-white"
                  }`}
                >
                  {isPaid ? "Paid ✅" : "Unpaid ⚠️"}
                </span>
              </div>

              <p className="font-semibold text-gray-800">{t.date}</p>
              <p className="text-sm text-gray-600">Total: ₹{t.total}</p>
              <p className="text-sm font-medium text-red-600">Due: ₹{t.due}</p>

              {/* Payment actions */}
              {!isPaid && (
                <div className="mt-3 space-y-2">
                  <div className="flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateTransaction(t.id, "full");
                      }}
                      className={`flex-1 px-3 py-1 rounded-full text-sm font-medium ${
                        info.mode === "full"
                          ? "bg-green-500 text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-green-100"
                      }`}
                    >
                      Full
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        updateTransaction(t.id, "partial", info.amount || 0);
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
                  {info.mode === "partial" && !info.finalized && (
                    <div className="flex gap-2 mt-2">
                      <input
                        type="number"
                        min={0}
                        max={t.due}
                        value={info.amount || ""}
                        onChange={(e) =>
                          setSelectedTransactions((prev) => ({
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
                          savePartial(t.id, info.amount, t.due);
                        }}
                        className="btn btn-sm btn-success"
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

      {/* Total Selected Payable */}
      {Object.keys(selectedTransactions).length > 0 && (
        <div className="mt-6 bg-white shadow rounded-xl p-4 flex justify-between items-center border border-gray-200">
          <span className="text-gray-700 font-medium">
            Total Selected Payable
          </span>
          <span className="text-xl font-bold text-indigo-600">
            ₹{totalSelectedAmount}
          </span>
          <button
            className="btn btn-primary"
            onClick={handleUpdateSupplierPayments}
          >
            Confirm Payment
          </button>
        </div>
      )}

      {/* Transaction Modal */}
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
              {modalTransaction.items.map((i, idx) => (
                <div key={idx} className="flex justify-between mb-2">
                  <span className="text-gray-700">
                    {i.name} x{i.qty}
                  </span>
                  <span className="font-semibold text-gray-900">
                    ₹{i.qty * i.rate}
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

export default SupplierDetails;
