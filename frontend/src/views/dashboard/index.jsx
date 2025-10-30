import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Plus, Receipt } from "lucide-react"; // Receipt icon for expense
import ExpenseModal from "./components/expenseModal";

const SellerDashboard = () => {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [buyerFilter, setBuyerFilter] = useState("");
  const [sales, setSales] = useState([
    { id: 1, buyer: "Buyer A", total: 1200, type: "Cash" },
    { id: 2, buyer: "Buyer B", total: 3400, type: "Credit" },
  ]);

  const [isExpenseOpen, setIsExpenseOpen] = useState(false); // 🔹 control modal

  const navigate = useNavigate();
  const location = useLocation();

  // 🔹 Collect new sales coming from SellPage
  useEffect(() => {
    if (location.state?.newSale) {
      setSales((prev) => [
        ...prev,
        { id: Date.now(), ...location.state.newSale },
      ]);
      window.history.replaceState({}, document.title); // clear after adding
    }
  }, [location.state]);

  // 🔹 Group by buyer & sum totals
  const buyerTotals = sales.reduce((acc, sale) => {
    if (!acc[sale.buyer]) {
      acc[sale.buyer] = { buyer: sale.buyer, total: 0, type: sale.type };
    }
    acc[sale.buyer].total += sale.total;
    return acc;
  }, {});

  const buyersList = Object.values(buyerTotals);

  const filteredSales = buyersList.filter((sale) =>
    sale.buyer.toLowerCase().includes(buyerFilter.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-indigo-100 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Daily Seller Dashboard
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
            <Plus className="w-5 h-5" /> Sell
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
        {filteredSales.length === 0 ? (
          <p className="text-gray-500 italic">No sales found</p>
        ) : (
          filteredSales.map((sale) => (
            <div
              key={sale.buyer}
              className="bg-white shadow-md rounded-2xl p-6 border border-gray-200"
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
    </div>
  );
};

export default SellerDashboard;
