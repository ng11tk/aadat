import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";
import { useMutation, useQuery } from "@apollo/client/react";
import { INSERT_SUPPLIER } from "../../graphql/mutation";
import { promiseResolver } from "../../utils/promisResolver";
import { FETCH_SUPPLIERS } from "../../graphql/query";

const formatDate = (date) => date.toISOString().split("T")[0];

const SupplierDashboard = () => {
  const navigate = useNavigate();
  const today = new Date();
  const [fromDate, setFromDate] = useState(
    formatDate(new Date(today.getFullYear(), today.getMonth(), 1))
  );
  const [supplierFromDatabase, setSuppliersFromDatabase] = useState([]);
  console.log(
    "🚀 ~ SupplierDashboard ~ supplierFromDatabase:",
    supplierFromDatabase
  );
  const [toDate, setToDate] = useState(formatDate(today));
  const [supplierFilter, setSupplierFilter] = useState("");
  const [filterMode, setFilterMode] = useState("thisMonth");
  const [statusFilter, setStatusFilter] = useState("all"); // new filter
  const [suppliers, setSuppliers] = useState([
    {
      id: 1,
      supplier: "Supplier X",
      contact: "9876543210",
      total: 5000,
      paid: 5000,
      type: "Cash",
      date: "2025-09-15",
    },
    {
      id: 2,
      supplier: "Supplier Y",
      contact: "9123456780",
      total: 7500,
      paid: 5000,
      type: "Credit",
      date: "2025-09-16",
    },
    {
      id: 3,
      supplier: "Supplier Z",
      contact: "9988776655",
      total: 6000,
      paid: 0,
      type: "Cash",
      date: "2025-09-10",
    },
  ]);
  const location = useLocation();

  // --- Modal state ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSupplier, setNewSupplier] = useState({
    supplier: "",
    contact: "",
    total: "",
    paid: "",
    type: "Cash",
  });

  // fetch suppliers

  const {
    error,
    data: { supplier_supplier: supplier_supplier = [] } = {},
    loading,
  } = useQuery(FETCH_SUPPLIERS);

  // update suppliers state when data changes
  useEffect(() => {
    if (supplier_supplier && supplier_supplier.length > 0) {
      setSuppliersFromDatabase(supplier_supplier);
    }
  }, [supplier_supplier]);

  // mutation in data from purchase page
  const [insertSupplier] = useMutation(INSERT_SUPPLIER);

  useEffect(() => {
    if (location.state?.newPurchase) {
      setSuppliers((prev) => [
        ...prev,
        { id: Date.now(), ...location.state.newPurchase },
      ]);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // --- Filters ---
  const applyQuickFilter = (mode) => {
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

  // Group by supplier
  const supplierTotals = suppliers
    .filter((p) => {
      const d = new Date(p.date);
      return d >= new Date(fromDate) && d <= new Date(toDate);
    })
    .reduce((acc, purchase) => {
      if (!acc[purchase.supplier]) {
        acc[purchase.supplier] = {
          supplier: purchase.supplier,
          contact: purchase.contact,
          total: 0,
          paid: 0,
          type: purchase.type,
        };
      }
      acc[purchase.supplier].total += purchase.total;
      acc[purchase.supplier].paid += purchase.paid;
      return acc;
    }, {});

  const suppliersList = Object.values(supplierTotals);

  // --- Apply filters ---
  const filteredSuppliers = suppliersList
    .filter((p) =>
      p.supplier.toLowerCase().includes(supplierFilter.toLowerCase())
    )
    .filter((p) => {
      const due = p.total - p.paid;
      if (statusFilter === "all") return true;
      if (statusFilter === "paid") return due === 0;
      if (statusFilter === "unpaid") return p.paid === 0;
      if (statusFilter === "partial") return p.paid > 0 && due > 0;
      return true;
    });

  // --- Summary Totals ---
  const totalAmount = filteredSuppliers.reduce((sum, s) => sum + s.total, 0);
  const totalPaid = filteredSuppliers.reduce((sum, s) => sum + s.paid, 0);
  const totalDue = totalAmount - totalPaid;

  // --- Save new supplier ---
  const handleSaveSupplier = async () => {
    if (!newSupplier.supplier || !newSupplier.contact) return;

    setSuppliers((prev) => [
      ...prev,
      {
        id: Date.now(),
        ...newSupplier,
        total: Number(newSupplier.total),
        paid: Number(newSupplier.paid) || 0,
        date: formatDate(today),
      },
    ]);

    // Insert supplier into database
    const [insertSupplierData, insertSupplierError] = await promiseResolver(
      insertSupplier({
        variables: {
          object: {
            name: newSupplier.supplier,
            phone: Number(newSupplier.contact),
          },
        },
      })
    );

    if (insertSupplierError) {
      console.error("Error inserting supplier:", insertSupplierError);
    } else {
      console.log("Inserted supplier:", insertSupplierData);
    }

    setNewSupplier({
      supplier: "",
      contact: "",
      total: "",
      paid: "",
      type: "Cash",
    });
    setIsModalOpen(false);
  };

  if (loading) return <p>Loading...</p>;
  return (
    <div className="p-6 bg-gray-50 min-h-screen text-gray-900">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Supplier Dashboard</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white font-semibold shadow hover:bg-emerald-700 transition"
        >
          <Plus className="w-5 h-5" /> Add Supplier
        </button>
      </div>

      {/* --- Summary Strip --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <motion.div
          whileHover={{ y: -3 }}
          className="bg-white shadow rounded-xl p-5 border border-gray-200"
        >
          <p className="text-gray-500 text-sm">Total Purchases</p>
          <h2 className="text-xl font-bold text-indigo-600">₹{totalAmount}</h2>
        </motion.div>

        <motion.div
          whileHover={{ y: -3 }}
          className="bg-white shadow rounded-xl p-5 border border-gray-200"
        >
          <p className="text-gray-500 text-sm">Total Paid</p>
          <h2 className="text-xl font-bold text-green-600">₹{totalPaid}</h2>
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

        <input
          type="text"
          placeholder="Search supplier"
          value={supplierFilter}
          onChange={(e) => setSupplierFilter(e.target.value)}
          className="ml-auto px-3 py-2 border rounded-lg text-gray-700 bg-white shadow-sm w-64"
        />
      </div>

      {/* Payment Status Filter */}
      <div className="flex gap-2 mb-4">
        {["all", "paid", "unpaid", "partial"].map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-1 rounded-full text-sm font-medium transition ${
              statusFilter === status
                ? "bg-emerald-600 text-white"
                : "bg-white border border-gray-300 text-gray-700 hover:bg-emerald-50"
            }`}
          >
            {status.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Supplier Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSuppliers.length === 0 ? (
          <p className="text-gray-500 italic">No suppliers found</p>
        ) : (
          filteredSuppliers.map((p) => {
            const due = p.total - p.paid;
            const status =
              due === 0 ? "paid" : p.paid === 0 ? "unpaid" : "partial";

            return (
              <motion.div
                key={p.supplier}
                whileHover={{
                  y: -3,
                  boxShadow: "0px 8px 18px rgba(0,0,0,0.08)",
                }}
                className={`relative rounded-xl p-5 transition-all border cursor-pointer ${
                  status === "paid"
                    ? "bg-green-50 border-green-200"
                    : status === "partial"
                    ? "bg-orange-50 border-orange-200"
                    : "bg-red-50 border-red-200"
                }`}
                onClick={() =>
                  navigate(`/suppliers/${encodeURIComponent(p.supplier)}`, {
                    state: { supplier: p },
                  })
                }
              >
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-semibold text-gray-800">
                    {p.supplier}
                  </h2>
                  <span
                    className={`badge text-white ${
                      status === "paid"
                        ? "badge-success"
                        : status === "partial"
                        ? "badge-warning"
                        : "badge-error"
                    }`}
                  >
                    {status}
                  </span>
                </div>
                <p className="text-sm text-gray-600">Total: ₹{p.total}</p>
                <p className="text-sm text-gray-600">Paid: ₹{p.paid}</p>
                <p className="text-sm text-gray-600">Due: ₹{due}</p>
                <p className="text-xs text-gray-400 italic">Type: {p.type}</p>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Add Supplier Modal */}
      {isModalOpen && (
        <dialog open className="modal modal-open">
          <div className="modal-box max-w-md">
            <h3 className="font-bold text-lg mb-4">Add New Supplier</h3>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Supplier Name"
                className="input input-bordered w-full"
                value={newSupplier.supplier}
                onChange={(e) =>
                  setNewSupplier({ ...newSupplier, supplier: e.target.value })
                }
              />
              <input
                type="text"
                placeholder="Contact"
                className="input input-bordered w-full"
                value={newSupplier.contact}
                onChange={(e) =>
                  setNewSupplier({ ...newSupplier, contact: e.target.value })
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
              <button className="btn btn-primary" onClick={handleSaveSupplier}>
                Save
              </button>
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
};

export default SupplierDashboard;
