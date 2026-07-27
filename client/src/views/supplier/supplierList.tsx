import React, { useState, useEffect } from "react";
import { Plus, Search, Filter } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useApolloClient, useQuery } from "@apollo/client/react";
import { FETCH_SUPPLIERS_AGGREGATE } from "../../graphql/query";
import { useDebounce } from "../../utils/debounce";
import api from "../../lib/axios";
import { promiseResolver } from "../../utils/promisResolver";
import PaymentStatusFilter from "../../components/paymentStatusFilter";
import AddSupplier from "./components/modals/addSupplier";
import SupplierCard from "./components/supplierCard";

const SupplierDashboard = () => {
  const client = useApolloClient();
  const [supplierFromDatabase, setSuppliersFromDatabase] = useState([]);
  const [supplierFilter, setSupplierFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("partial");
  const [typeFilter, setTypeFilter] = useState("supplier");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSupplier, setNewSupplier] = useState({
    supplier: "",
    contact: "",
    type: "supplier",
  });
  const [insertSupplierLoading, setInsertSupplierLoading] = useState(false);

  const debouncedSupplierFilter = useDebounce(supplierFilter, 400);

  // Build GraphQL where filter object
  const whereSupplier = {
    ...(typeFilter !== "all" && { type: { _eq: typeFilter } }),
    ...(statusFilter !== "all" && { payment_status: { _eq: statusFilter } }),
    ...(debouncedSupplierFilter.trim() !== "" && {
      name: { _ilike: `%${debouncedSupplierFilter}%` },
    }),
  };
  // fetch suppliers details
  const { error, data, loading } = useQuery(FETCH_SUPPLIERS_AGGREGATE, {
    variables: { whereSupplier },
    // fetchPolicy: "network-only",
  });
  const supplierList = data?.supplier_supplier ?? [];
  // Clean state update (no infinite loop)
  useEffect(() => {
    if (!data) return;

    const formatted = supplierList.map((s) => ({
      id: s.id,
      supplier: s.name,
      total: s.amount || 0,
      paid: s.amount - s.remaining_amount || 0,
      contact: s.phone,
      type: s.type,
    }));

    setSuppliersFromDatabase(formatted);
  }, [data]);

  //* handlers
  const handleSaveSupplier = async () => {
    // final validation
    if (!newSupplier.supplier) {
      return;
    }

    const digits = (newSupplier.contact || "").replace(/\D/g, "");

    const customObject = {
      name: newSupplier.supplier,
      phone: digits,
      type: newSupplier.type,
    };

    setInsertSupplierLoading(true);

    try {
      const [res, err] = await promiseResolver(
        api.post("/api/v1/suppliers/supplier", {
          customObject,
        }),
      );
      if (err) {
        console.error("Insert Supplier API Error:", err);
        setInsertSupplierLoading(false);
        return;
      }
    } catch (err) {
      console.error("Insert Supplier Error:", err);
      setInsertSupplierLoading(false);
      return;
    }

    setInsertSupplierLoading(false);

    // cache eviction to refetch suppliers
    client.cache.evict({
      fieldName: "supplier_supplier",
    });

    client.cache.gc();

    setNewSupplier({ supplier: "", contact: "", type: "supplier" });
    setIsModalOpen(false);
  };

  // Totals
  const totalAmount = supplierFromDatabase.reduce((sum, s) => sum + s.total, 0);
  const totalPaid = supplierFromDatabase.reduce(
    (sum, s) => sum + (s.total - s.paid),
    0,
  );
  const totalDue = totalAmount - totalPaid;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Supplier Dashboard
                </h1>
                <p className="text-xs text-gray-500">
                  Manage & track suppliers
                </p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 transition text-sm flex-shrink-0"
            >
              <Plus className="w-4 h-4" /> Add
            </motion.button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition"
          >
            <p className="text-gray-600 text-sm font-medium mb-2">
              Total Purchases
            </p>
            <h2 className="text-3xl font-bold text-indigo-600">
              ₹{totalAmount.toLocaleString()}
            </h2>
            <p className="text-xs text-gray-400 mt-2">
              From {supplierFromDatabase.length} suppliers
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            whileHover={{ y: -5 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition"
          >
            <p className="text-gray-600 text-sm font-medium mb-2">Total Paid</p>
            <h2 className="text-3xl font-bold text-emerald-600">
              ₹{totalPaid.toLocaleString()}
            </h2>
            <p className="text-xs text-gray-400 mt-2">
              {((totalPaid / totalAmount) * 100 || 0).toFixed(1)}% paid
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ y: -5 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition"
          >
            <p className="text-gray-600 text-sm font-medium mb-2">Total Due</p>
            <h2 className="text-3xl font-bold text-red-600">
              ₹{totalDue.toLocaleString()}
            </h2>
            <p className="text-xs text-gray-400 mt-2">
              {((totalDue / totalAmount) * 100 || 0).toFixed(1)}% pending
            </p>
          </motion.div>
        </div>

        {/* Filters Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-semibold text-gray-700">Filters</h3>
          </div>

          <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center lg:justify-between">
            {/* Payment Status Filter */}
            <div className="w-full lg:w-auto">
              <PaymentStatusFilter
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
              />
            </div>

            {/* Supplier Type Filter */}
            <div className="flex gap-2 w-full lg:w-auto">
              {[
                { key: "all", label: "All Types" },
                { key: "supplier", label: "Supplier" },
                { key: "modi", label: "Modi" },
              ].map((t) => (
                <motion.button
                  key={t.key}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setTypeFilter(t.key)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition whitespace-nowrap ${
                    typeFilter === t.key
                      ? "bg-indigo-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {t.label}
                </motion.button>
              ))}
            </div>

            {/* Search */}
            <div className="relative w-full lg:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search supplier..."
                value={supplierFilter}
                onChange={(e) => setSupplierFilter(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>
          </div>
        </div>

        {/* Supplier Cards */}
        <AnimatePresence>
          <SupplierCard
            loading={loading}
            supplierFromDatabase={supplierFromDatabase}
          />
        </AnimatePresence>
      </div>

      {/* Add Supplier Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <AddSupplier
            setIsModalOpen={setIsModalOpen}
            newSupplier={newSupplier}
            setNewSupplier={setNewSupplier}
            insertSupplierLoading={insertSupplierLoading}
            handleSaveSupplier={handleSaveSupplier}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default SupplierDashboard;
