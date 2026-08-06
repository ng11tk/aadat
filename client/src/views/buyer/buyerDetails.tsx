import React, { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { useApolloClient, useQuery } from "@apollo/client/react";
import { FETCH_BUYER_DETAILS } from "../../graphql/query";
import { promiseResolver } from "../../utils/promisResolver";
import api from "../../lib/axios";
import { formatDate } from "../../utils/time";
import DateFilter from "../../components/dateFilter";
import PaymentStatusFilter from "../../components/paymentStatusFilter";
import ItemDetails from "./components/modals/itemDetails";
import TransactionCard from "./components/transactionCard";
import {
  ArrowLeft,
  Phone,
  TrendingDown,
  TrendingUp,
  Building2,
} from "lucide-react";

const BuyerDetails = () => {
  const client = useApolloClient();
  const navigate = useNavigate();
  const today = new Date();
  const location = useLocation();
  const buyerFromState = location.state?.buyer || {};
  const [buyer, setBuyer] = useState<any>(buyerFromState);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [modalTransaction, setModalTransaction] = useState<any | null>(null);
  const [fromDate, setFromDate] = useState(
    formatDate(new Date(today.getFullYear(), today.getMonth(), 1)),
  );
  const [toDate, setToDate] = useState(formatDate(today));
  const [statusFilter, setStatusFilter] = useState("partial");
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // where filter for supplier details
  const whereBuyerTransactionsDetails = useMemo(() => {
    const w = {};

    if (!fromDate && toDate) {
      w.purchase_date = { _eq: toDate };
    }
    // only add date filter when both fromDate and toDate are present
    if (fromDate && toDate) {
      w.purchase_date = { _gte: fromDate, _lte: toDate };
    }

    return w;
  }, [fromDate, toDate]);

  //* queries
  // fetch buyer details
  const {
    error: buyerError,
    data: { buyer_buyers_by_pk: buyer_buyers_by_pk = {} } = {},
    loading: buyerLoading,
    refetch: refetchBuyer,
  } = useQuery(FETCH_BUYER_DETAILS, {
    variables: { id: buyerFromState.id, where: whereBuyerTransactionsDetails },
  });

  useEffect(() => {
    // populate buyer
    if (
      !buyer_buyers_by_pk?.buyer_purchases_aggregate?.nodes ||
      !buyer_buyers_by_pk?.buyer_purchases_aggregate?.aggregate
    )
      return;
    // try to load transactions for this buyer from localStorage (key: sales)
    // normalize transactions
    const t = buyer_buyers_by_pk?.buyer_purchases_aggregate?.nodes.map(
      (s: any, idx: number) => ({
        id: s.id,
        date: s.purchase_date,
        total: s.total_amount || 0,
        due: s.remaining_amount || 0,
        items: s.sales_order.sales_order_items.map((it: any) => ({
          name: it.item_name,
          quantity: it.quantity,
          rate: it.unit_price,
        })),
      }),
    );
    const { remaining_amount, total_amount } =
      buyer_buyers_by_pk?.buyer_purchases_aggregate?.aggregate?.sum;
    setBuyer({
      ...buyer,
      total: total_amount,
      due: remaining_amount,
    });
    setTransactions(t);
  }, [buyer_buyers_by_pk]);

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      const d = new Date(t.date);
      const rangeStart = new Date(fromDate);
      const rangeEnd = new Date(toDate);
      rangeEnd.setHours(23, 59, 59, 999);
      const withinDate = d >= rangeStart && d <= rangeEnd;
      const statusMatch =
        statusFilter === "all" ||
        (statusFilter === "paid" && t.due === 0) ||
        (statusFilter === "partial" && t.due > 0);
      return withinDate && statusMatch;
    });
  }, [transactions, fromDate, toDate, statusFilter]);

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
    0,
  );

  const confirmPayment = async () => {
    if (Object.keys(selectedTransactions).length === 0) return;
    if (isSubmittingPayment) return;

    setIsSubmittingPayment(true);

    const [, error] = await promiseResolver(
      api.post("/api/v1/buyers/buyer/transactions", { selectedTransactions }),
    );

    setIsSubmittingPayment(false);

    if (error) {
      alert("Error recording payment. Please try again.");
      return;
    }

    client.cache.evict({ fieldName: "buyer_buyers" });
    client.cache.gc();

    setSelectedTransactions({});
    refetchBuyer();
  };

  const hasSelection = Object.keys(selectedTransactions).length > 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
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
                {buyerLoading ? "Loading..." : buyer.name || "Buyer Details"}
              </h1>
              <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-1">
                <Phone className="h-3.5 w-3.5" />
                {buyer.contact || buyer.phone || "—"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div
        className={`max-w-7xl mx-auto px-6 py-8 space-y-6 ${hasSelection ? "pb-28" : ""}`}
      >
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
              ₹{(buyer.total || 0).toLocaleString()}
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
              ₹{(buyer.due || 0).toLocaleString()}
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
            <h3 className="text-3xl font-bold text-emerald-600">₹0</h3>
            <p className="text-xs text-gray-500 mt-2">Credited amount</p>
          </motion.div>
        </div>

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

        {buyerLoading && (
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

        {!buyerLoading && !buyerError && (
          <>
            {!filtered.length && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-16 bg-white rounded-xl border border-gray-100"
              >
                <p className="text-gray-500 text-sm font-medium">
                  No transactions found
                </p>
                <p className="text-gray-400 text-xs mt-1">
                  Try adjusting the date range or filters
                </p>
              </motion.div>
            )}
            {filtered.length > 0 && (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filtered.map((t, index) => (
                  <motion.div
                    key={t.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <TransactionCard
                      setModalTransaction={setModalTransaction}
                      transaction={t}
                      selectedTransactions={selectedTransactions}
                      setSelectedTransactions={setSelectedTransactions}
                      updateTransaction={updateTransactionSelection}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

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
                onClick={confirmPayment}
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

export default BuyerDetails;
