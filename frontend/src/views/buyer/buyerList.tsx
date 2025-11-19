import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";

const formatDate = (date: Date) => date.toISOString().split("T")[0];

const BuyerDashboard = () => {
  const navigate = useNavigate();
  const today = new Date();
  const [fromDate, setFromDate] = useState(
    formatDate(new Date(today.getFullYear(), today.getMonth(), 1))
  );
  const [toDate, setToDate] = useState(formatDate(today));
  const [buyerFilter, setBuyerFilter] = useState("");
  const [filterMode, setFilterMode] = useState("thisMonth");
  const [buyers, setBuyers] = useState<any[]>([]);

  // modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newBuyer, setNewBuyer] = useState({ name: "", contact: "" });

  // load buyers from localStorage if available, otherwise sample data
  useEffect(() => {
    try {
      const stored = localStorage.getItem("buyers");
      if (stored) {
        setBuyers(JSON.parse(stored));
        return;
      }
    } catch (err) {
      // ignore
    }

    // fallback sample
    setBuyers([
      { id: 1, name: "Buyer A", total: 1200, paid: 800, contact: "123456" },
      { id: 2, name: "Buyer B", total: 3400, paid: 1000, contact: "987654" },
    ]);
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem("buyers", JSON.stringify(buyers));
    } catch (err) {}
  }, [buyers]);

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

  const handleSaveBuyer = () => {
    if (!newBuyer.name) return;
    setBuyers((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: newBuyer.name,
        total: 0,
        paid: 0,
        contact: newBuyer.contact,
      },
    ]);
    setNewBuyer({ name: "", contact: "" });
    setIsModalOpen(false);
  };

  const totalAmount = buyers.reduce((sum, b) => sum + (b.total || 0), 0);
  const totalPaid = buyers.reduce((sum, b) => sum + (b.paid || 0), 0);
  const totalDue = totalAmount - totalPaid;

  const filtered = buyers.filter((b) =>
    b.name.toLowerCase().includes(buyerFilter.toLowerCase())
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen text-gray-900">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Buyer Dashboard</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold shadow hover:bg-indigo-700 transition"
        >
          <Plus className="w-5 h-5" /> Add Buyer
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <motion.div
          whileHover={{ y: -3 }}
          className="bg-white shadow rounded-xl p-5 border border-gray-200"
        >
          <p className="text-gray-500 text-sm">Total Sales</p>
          <h2 className="text-xl font-bold text-indigo-600">₹{totalAmount}</h2>
        </motion.div>

        <motion.div
          whileHover={{ y: -3 }}
          className="bg-white shadow rounded-xl p-5 border border-gray-200"
        >
          <p className="text-gray-500 text-sm">Total Paid</p>
          <h2 className="text-xl font-bold text-indigo-600">₹{totalPaid}</h2>
        </motion.div>

        <motion.div
          whileHover={{ y: -3 }}
          className="bg-white shadow rounded-xl p-5 border border-gray-200"
        >
          <p className="text-gray-500 text-sm">Total Due</p>
          <h2 className="text-xl font-bold text-red-600">₹{totalDue}</h2>
        </motion.div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        {["today", "thisWeek", "thisMonth", "custom"].map((mode) => (
          <button
            key={mode}
            onClick={() => applyQuickFilter(mode)}
            className={`px-4 py-2 rounded-lg border text-sm font-medium shadow-sm transition ${
              filterMode === mode
                ? "bg-indigo-600 text-white border-indigo-600"
                : "bg-white border-gray-300 text-gray-700 hover:bg-indigo-50"
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

        <input
          type="text"
          placeholder="Search buyer"
          value={buyerFilter}
          onChange={(e) => setBuyerFilter(e.target.value)}
          className="ml-auto px-3 py-2 border rounded-lg text-gray-700 bg-white shadow-sm w-64"
        />
      </div>

      {/* Buyer Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.length === 0 ? (
          <p className="text-gray-500 italic">No buyers found</p>
        ) : (
          filtered.map((b) => {
            const due = (b.total || 0) - (b.paid || 0);
            const status =
              due === 0 ? "paid" : b.paid === 0 ? "unpaid" : "partial";
            return (
              <motion.div
                key={b.name}
                whileHover={{
                  y: -3,
                  boxShadow: "0px 8px 18px rgba(0,0,0,0.08)",
                }}
                className={`relative rounded-xl p-5 transition-all border cursor-pointer ${
                  status === "paid"
                    ? "bg-indigo-50 border-indigo-200"
                    : status === "partial"
                    ? "bg-orange-50 border-orange-200"
                    : "bg-red-50 border-red-200"
                }`}
                onClick={() =>
                  navigate(`/buyers/${encodeURIComponent(b.name)}`, {
                    state: { buyer: b },
                  })
                }
              >
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-800">
                    {b.name}
                  </h2>
                  <span
                    className={`badge text-white ${
                      status === "paid"
                        ? "badge-primary"
                        : status === "partial"
                        ? "badge-warning"
                        : "badge-error"
                    }`}
                  >
                    {status.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-gray-600">Total: ₹{b.total}</p>
                <p className="text-sm text-gray-600">Paid: ₹{b.paid}</p>
                <p className="text-sm text-gray-600">Due: ₹{due}</p>
                <p className="text-xs text-gray-400 italic">
                  Contact: {b.contact}
                </p>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Add Buyer Modal */}
      {isModalOpen && (
        <dialog open className="modal modal-open">
          <div className="modal-box max-w-md">
            <h3 className="font-bold text-lg mb-4">Add New Buyer</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Buyer Name"
                className="input input-bordered w-full"
                value={newBuyer.name}
                onChange={(e) =>
                  setNewBuyer({ ...newBuyer, name: e.target.value })
                }
              />
              <input
                type="text"
                placeholder="Contact"
                className="input input-bordered w-full"
                value={newBuyer.contact}
                onChange={(e) =>
                  setNewBuyer({ ...newBuyer, contact: e.target.value })
                }
              />
            </div>
            <div className="modal-action">
              <button
                className="btn btn-outline"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleSaveBuyer}>
                Save
              </button>
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
};

export default BuyerDashboard;
