import React, { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Receipt } from "lucide-react"; // Receipt icon for expense
import ExpenseModal from "./components/expenseModal";
import { useQuery } from "@apollo/client/react";
import { FETCH_SALES } from "../../graphql/query";
import { useDebounce } from "../../utils/debounce";

const SalesDashboard = () => {
  const navigate = useNavigate();
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [buyerFilter, setBuyerFilter] = useState("");
  const [sales, setSales] = useState([]);
  const [modalTransaction, setModalTransaction] = useState(null);
  const [isExpenseOpen, setIsExpenseOpen] = useState(false); // 🔹 control modal

  const debouncedBuyerFilter = useDebounce(buyerFilter, 400);

  // Build GraphQL where filter object
  const whereSales = useMemo(() => {
    const w = {};
    if (debouncedBuyerFilter.trim() !== "")
      w.buyer = { name: { _ilike: `%${debouncedBuyerFilter}%` } };
    // include order_date in the where clause so the query uses a single where variable
    if (date) w.order_date = { _eq: date };
    return w;
  }, [debouncedBuyerFilter, date]);

  // fetch sales
  const {
    loading: salesLoading,
    data: salesData,
    error: salesError,
  } = useQuery(FETCH_SALES, {
    variables: {
      where: whereSales,
    },
  });

  useEffect(() => {
    if (!salesData) return;

    const result = salesData?.sales_sales_order.map((o) => {
      return {
        id: o.id,
        buyer: o?.buyer?.name,
        total: o?.total_amount,
        type: "",
        sales_order_items: o.sales_order_items,
      };
    });
    setSales(result);
  }, [salesData]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-indigo-100 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Daily Sales Dashboard
        </h1>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="px-3 py-2 border rounded-lg text-gray-700"
        />
      </div>

      {/* Filters + Action Buttons */}
      <div className="flex justify-between items-center mb-8">
        <input
          type="text"
          placeholder="Filter by buyer"
          value={buyerFilter}
          onChange={(e) => setBuyerFilter(e.target.value)}
          className="px-3 py-2 border rounded-lg text-gray-700 w-64"
        />

        <div className="flex gap-3">
          <button
            onClick={() => navigate("/selling")}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold shadow hover:bg-indigo-700 transition"
          >
            <Plus className="w-5 h-5" /> Sale
          </button>
          <button
            onClick={() => setIsExpenseOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-600 text-white font-semibold shadow hover:bg-rose-700 transition"
          >
            <Receipt className="w-5 h-5" /> Expense
          </button>
        </div>
      </div>

      {/* Sales List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sales.length === 0 ? (
          <p className="text-gray-500 italic">No sales found</p>
        ) : (
          sales.map((sale) => (
            <div
              key={sale.buyer}
              className="bg-white shadow-md rounded-2xl p-6 border border-gray-200"
              onClick={() => setModalTransaction(sale)}
            >
              <h2 className="text-lg font-semibold text-gray-900">
                {sale.buyer}
              </h2>
              <p className="text-gray-700 mt-2">
                Total:{" "}
                <span className="font-bold text-indigo-600">₹{sale.total}</span>
              </p>
              <p className="text-gray-600 text-sm mt-1">Type: {sale.type}</p>
            </div>
          ))
        )}
      </div>

      {/* Expense Modal */}
      {isExpenseOpen && (
        <ExpenseModal onClose={() => setIsExpenseOpen(false)} />
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
              {modalTransaction.sales_order_items.map((i, idx) => (
                <div key={idx} className="flex justify-between mb-2">
                  <span className="text-gray-700">
                    {i.item_name} x{i.quantity}
                  </span>
                  <span className="font-semibold text-gray-900">
                    ₹{i.quantity * i.unit_price}
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

export default SalesDashboard;
