import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { FETCH_SUPPLIER_DETAILS } from "../../graphql/query";
import { useApolloClient, useQuery } from "@apollo/client/react";
import { promiseResolver } from "../../utils/promisResolver";
import api from "../../lib/axios";
import DateFilter from "../../components/dateFilter";
import { today, formatDate } from "../../utils/time";
import PaymentStatusFilter from "../../components/paymentStatusFilter";
import ItemDetails from "./components/modals/itemDetails";
import TransactionCard from "./components/transactionCard";
import {
  Phone,
  Building2,
  Package,
  ArrowLeft,
  TrendingDown,
  TrendingUp,
} from "lucide-react";

const SupplierDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const client = useApolloClient();
  const suppliers = location.state?.supplier || {};
  const [supplier, setSupplier] = useState({});
  const [selectedTransactions, setSelectedTransactions] = useState({});
  const [modalTransaction, setModalTransaction] = useState(null);
  const [statusFilter, setStatusFilter] = useState("partial");
  const [fromDate, setFromDate] = useState(
    formatDate(new Date(today.getFullYear(), today.getMonth(), 1)),
  );
  const [toDate, setToDate] = useState(formatDate(today));
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  const whereSupplierUnloadingDetails = useMemo(() => {
    if (fromDate && toDate) {
      return { unloading_date: { _gte: fromDate, _lte: toDate } };
    }
    if (toDate) {
      return { unloading_date: { _eq: toDate } };
    }
    return {};
  }, [fromDate, toDate]);

  const { error, data, loading, refetch } = useQuery(FETCH_SUPPLIER_DETAILS, {
    variables: {
      id: suppliers.id,
      name: suppliers.supplier,
      phone: suppliers.contact,
      whereSupplierUnloading: whereSupplierUnloadingDetails,
    },
  });

  const supplier_supplier = data?.supplier_supplier_by_pk;

  useEffect(() => {
    if (!supplier_supplier) return;

    const s = supplier_supplier;
    // Guard against `nodes` being null/undefined (e.g. supplier with no
    // transactions yet), not just the aggregate object itself.
    const nodes = s.supplier_unloadings_aggregate?.nodes ?? [];

    const formattedSupplier = {
      ...s,
      contact: s.phone,
      totalSale: s.supplier_unloadings_aggregate?.aggregate?.sum?.amount || 0,
      totalDue:
        s.supplier_unloadings_aggregate?.aggregate?.sum?.remaining_amount || 0,
      totalAdvance:
        s.supplier_unloadings_aggregate?.aggregate?.sum?.advance_amount || 0,
      transactions: nodes.map((t) => ({
        ...t,
        date: t.unloading_date,
        total: t.amount,
        due: t.remaining_amount,
        items: (t.unloading?.unloading_items ?? []).map((item) => ({
          ...item,
          qty: item.quantity,
        })),
      })),
    };

    setSupplier(formattedSupplier);
  }, [supplier_supplier]);

  const filteredTransactions = useMemo(() => {
    if (!supplier?.transactions) return [];

    const rangeStart = new Date(fromDate);
    const rangeEnd = new Date(toDate);
    rangeEnd.setHours(23, 59, 59, 999);

    return supplier.transactions.filter((t) => {
      const d = new Date(t.date);
      const withinDate = d >= rangeStart && d <= rangeEnd;
      const statusMatch =
        statusFilter === "all" ||
        (statusFilter === "paid" && t.due === 0) ||
        (statusFilter === "partial" && t.due > 0);
      return withinDate && statusMatch;
    });
  }, [supplier?.transactions, fromDate, toDate, statusFilter]);

  const updateTransaction = (id, mode, amount = 0) => {
    const t = supplier?.transactions?.find((tr) => tr.id === id);
    if (!t || t.due === 0) return;
    setSelectedTransactions((prev) => {
      if (prev[id]?.mode === mode) {
        const newObj = { ...prev };
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
    (sum, t) => sum + (t.amount || 0),
    0,
  );

  const handleUpdateSupplierPayments = async () => {
    if (Object.keys(selectedTransactions).length === 0) return;
    if (isSubmittingPayment) return;

    setIsSubmittingPayment(true);

    const [, err] = await promiseResolver(
      api.post("/api/v1/suppliers/supplier/transactions", {
        selectedTransactions,
      }),
    );

    setIsSubmittingPayment(false);

    if (err) {
      alert("Error updating payments. Please try again.");
      return;
    }

    client.cache.evict({ fieldName: "supplier_supplier_by_pk" });
    client.cache.gc();

    refetch();
    setSelectedTransactions({});
  };

  const hasSelection = Object.keys(selectedTransactions).length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </motion.button>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {loading ? "Loading..." : supplier.name || "Supplier Details"}
                </h1>
                <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-1">
                  <Phone className="h-3.5 w-3.5" />
                  {supplier.contact || "—"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div
        className={`max-w-7xl mx-auto px-6 py-8 space-y-6 ${hasSelection ? "pb-28" : ""}`}
      >
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600 text-sm font-medium">Total Sale</p>
              <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-blue-600" strokeWidth={2} />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-gray-900">
              ₹{(supplier.totalSale ?? 0).toLocaleString()}
            </h3>
            <p className="text-xs text-gray-500 mt-2">From all transactions</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600 text-sm font-medium">Total Due</p>
              <div className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center">
                <TrendingDown
                  className="w-4 h-4 text-red-600"
                  strokeWidth={2}
                />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-red-600">
              ₹{(supplier.totalDue ?? 0).toLocaleString()}
            </h3>
            <p className="text-xs text-gray-500 mt-2">Pending payments</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition"
          >
            <div className="flex items-center justify-between mb-2">
              <p className="text-gray-600 text-sm font-medium">Advance</p>
              <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
                <Building2
                  className="w-4 h-4 text-emerald-600"
                  strokeWidth={2}
                />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-emerald-600">
              ₹{(supplier.totalAdvance ?? 0).toLocaleString()}
            </h3>
            <p className="text-xs text-gray-500 mt-2">Credited amount</p>
          </motion.div>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-4 h-4 bg-indigo-600 rounded" />
            <h3 className="text-sm font-semibold text-gray-700">
              Filter Transactions
            </h3>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <DateFilter
              toDate={toDate}
              setToDate={setToDate}
              fromDate={fromDate}
              setFromDate={setFromDate}
            />
            <PaymentStatusFilter
              statusFilter={statusFilter}
              setStatusFilter={setStatusFilter}
            />
          </div>
        </div>

        {/* Transactions Grid */}
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center items-center py-16"
          >
            <div className="text-center">
              <div className="inline-block h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-gray-500 text-sm">Loading transactions...</p>
            </div>
          </motion.div>
        )}
        {!loading && error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-red-50 border border-red-200 rounded-xl p-8 text-center"
          >
            <p className="text-red-600 text-sm font-medium">
              Error loading supplier transactions. Please try again.
            </p>
          </motion.div>
        )}
        {!loading && !error && (
          <>
            {!filteredTransactions.length && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-gray-100"
              >
                <Package
                  className="h-10 w-10 text-gray-300 mb-3"
                  strokeWidth={1.5}
                />
                <p className="text-gray-500 text-sm font-medium">
                  No transactions found
                </p>
                <p className="text-gray-400 text-xs mt-1">
                  Try adjusting the date range or filters
                </p>
              </motion.div>
            )}
            {filteredTransactions.length > 0 && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTransactions.map((t, index) => (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <TransactionCard
                      setModalTransaction={setModalTransaction}
                      transaction={t}
                      setSelectedTransactions={setSelectedTransactions}
                      selectedTransactions={selectedTransactions}
                      updateTransaction={updateTransaction}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Payment Footer */}
      <AnimatePresence>
        {hasSelection && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-[0_-4px_12px_rgba(0,0,0,0.08)]"
          >
            <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
              <div>
                <p className="text-xs text-gray-500 mb-1">
                  {Object.keys(selectedTransactions).length} transaction
                  {Object.keys(selectedTransactions).length > 1 ? "s" : ""}{" "}
                  selected
                </p>
                <p className="text-2xl font-bold text-indigo-600">
                  ₹{totalSelectedAmount.toLocaleString()}
                </p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-3 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2 shadow-lg"
                onClick={handleUpdateSupplierPayments}
                disabled={isSubmittingPayment}
              >
                {isSubmittingPayment && (
                  <span
                    className="inline-block h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"
                    aria-hidden="true"
                  />
                )}
                {isSubmittingPayment ? "Processing..." : "Confirm Payment"}
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transaction Modal */}
      <AnimatePresence>
        {modalTransaction && (
          <ItemDetails
            setModalTransaction={setModalTransaction}
            modalTransaction={modalTransaction}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default SupplierDetails;
