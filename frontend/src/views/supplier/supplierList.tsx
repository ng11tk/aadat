import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";
import { useMutation, useQuery } from "@apollo/client/react";
import { INSERT_SUPPLIER } from "../../graphql/mutation";
import { promiseResolver } from "../../utils/promisResolver";
import { FETCH_SUPPLIERS_AGGREGATE } from "../../graphql/query";

const formatDate = (date) => date.toISOString().split("T")[0];

const SupplierDashboard = () => {
  const navigate = useNavigate();
  const today = new Date();
  const [fromDate, setFromDate] = useState(
    formatDate(new Date(today.getFullYear(), today.getMonth(), 1))
  );
  const [supplierFromDatabase, setSuppliersFromDatabase] = useState([]);
  const [toDate, setToDate] = useState(formatDate(today));
  const [supplierFilter, setSupplierFilter] = useState("");
  const [filterMode, setFilterMode] = useState("thisMonth");
  const [statusFilter, setStatusFilter] = useState("all"); // new filter

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
  // build where clause for supplier_unloadings aggregation depending on statusFilter
  const buildWhereSupplierUnloading = () => {
    const base = { unloading_date: { _gte: fromDate, _lte: toDate } };
    if (statusFilter === "paid") {
      // include only unloadings that are fully paid (remaining_amount = 0)
      return { ...base, remaining_amount: { _eq: 0 } };
    }
    if (statusFilter === "unpaid") {
      // include unloadings with remaining amount greater than 0 (unpaid or partial)
      return { ...base, remaining_amount: { _gt: 0 } };
    }
    if (statusFilter === "partial") {
      // partial also maps to remaining_amount > 0 (server cannot easily distinguish paid==0 vs partial without cross-field compare)
      return { ...base, remaining_amount: { _gt: 0 } };
    }
    // default: all unloadings in date range
    return base;
  };

  const whereSupplierUnloading = buildWhereSupplierUnloading();

  const {
    error,
    data: { supplier_supplier: supplier_supplier = [] } = {},
    loading,
    refetch,
  } = useQuery(FETCH_SUPPLIERS_AGGREGATE, {
    variables: {
      whereSupplier: {
        supplier_unloadings: whereSupplierUnloading,
        // name: { _ilike: `%${supplierFilter}%` },
        //todo: add debounce logic if needed
      },
    },
    fetchPolicy: "network-only",
  });

  // update suppliers state when data changes
  useEffect(() => {
    if (supplier_supplier && supplier_supplier.length > 0) {
      const formattedSuppliers = supplier_supplier.map((s) => ({
        id: s.id,
        supplier: s.name,
        total: s.supplier_unloadings_aggregate.aggregate.sum.amount || 0,
        paid:
          s.supplier_unloadings_aggregate.aggregate.sum.remaining_amount || 0,
        contact: s.phone,
        type: "Cash",
      }));
      setSuppliersFromDatabase(formattedSuppliers);
    }
  }, [supplier_supplier]);

  // mutation in data from purchase page
  const [insertSupplier] = useMutation(INSERT_SUPPLIER);
  // server returns aggregated totals per supplier (supplierFromDatabase is already that)
  const suppliersList = supplierFromDatabase || [];

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

  // --- Save new supplier ---
  const handleSaveSupplier = async () => {
    if (!newSupplier.supplier || !newSupplier.contact) return;

    // Insert supplier into database and refetch suppliers query
    try {
      await insertSupplier({
        variables: {
          object: {
            name: newSupplier.supplier,
            phone: Number(newSupplier.contact),
          },
        },
        refetchQueries: [{ query: FETCH_SUPPLIERS_AGGREGATE }],
      });
      console.log("Inserted supplier and refetched suppliers.");
    } catch (err) {
      console.error("Error inserting supplier:", err);
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

  const totalAmount = supplierFromDatabase.reduce(
    (sum, supplier) => sum + supplier.total,
    0
  );
  const totalPaid = supplierFromDatabase.reduce(
    (sum, supplier) => sum + (supplier.total - supplier.paid),
    0
  );
  const totalDue = totalAmount - totalPaid;

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
        {supplierFromDatabase.length === 0 ? (
          <p className="text-gray-500 italic">No suppliers found</p>
        ) : (
          supplierFromDatabase.map((p) => {
            const due = p.paid;
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
                    {status.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-gray-600">Total: ₹{p.total}</p>
                <p className="text-sm text-gray-600">Paid: ₹{p.total - due}</p>
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
