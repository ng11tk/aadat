import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";
import { useMutation, useQuery } from "@apollo/client/react";
import { INSERT_SUPPLIER } from "../../graphql/mutation";
import { promiseResolver } from "../../utils/promisResolver";
import { FETCH_SUPPLIERS_AGGREGATE } from "../../graphql/query";

const SupplierDashboard = () => {
  const navigate = useNavigate();
  const [supplierFromDatabase, setSuppliersFromDatabase] = useState(null);
  const [supplierFilter, setSupplierFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // new filter
  const [typeFilter, setTypeFilter] = useState("all");

  // --- Modal state ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newSupplier, setNewSupplier] = useState({
    supplier: "",
    contact: "",
    type: "supplier",
  });

  // fetch suppliers

  // Build GraphQL `where` object: include `type` and `payment_status` when selected
  const whereSupplier = (() => {
    const w = {};
    if (typeFilter && typeFilter !== "all") w.type = { _eq: typeFilter };
    if (statusFilter && statusFilter !== "all")
      w.payment_status = { _eq: statusFilter };
    // server-side supplier name filter (partial, case-insensitive)
    if (supplierFilter && supplierFilter.trim() !== "")
      w.name = { _ilike: `%${supplierFilter}%` };
    return w;
  })();

  const {
    error,
    data: { supplier_supplier: supplier_supplier = [] } = {},
    loading,
    refetch,
  } = useQuery(FETCH_SUPPLIERS_AGGREGATE, {
    variables: {
      whereSupplier,
    },
    fetchPolicy: "network-only",
  });

  // update suppliers state when data changes
  useEffect(() => {
    if (supplier_supplier != null) {
      const formattedSuppliers = supplier_supplier.map((s) => ({
        id: s.id,
        supplier: s.name,
        total: s.amount || 0,
        paid: s.remaining_amount || 0,
        contact: s.phone,
        type: s.type,
      }));
      setSuppliersFromDatabase(formattedSuppliers);
    }
  }, [supplier_supplier]);

  // mutation in data from purchase page
  const [insertSupplier, { loading: insertSupplierLoading }] =
    useMutation(INSERT_SUPPLIER);

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
            type: newSupplier.type,
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
      type: "supplier",
    });
    setIsModalOpen(false);
  };

  const totalAmount = supplierFromDatabase?.reduce(
    (sum, supplier) => sum + supplier.total,
    0
  );
  const totalPaid = supplierFromDatabase?.reduce(
    (sum, supplier) => sum + (supplier.total - supplier.paid),
    0
  );
  const totalDue = totalAmount - totalPaid;

  return (
    <div className="p-6 bg-gray-50 min-h-screen text-gray-900">
      {/* Header */}
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Supplier Dashboard</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold shadow hover:bg-indigo-700 transition"
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
        {/* Payment Status Filter */}
        <div className="flex gap-2 mb-4">
          {["all", "paid", "partial"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-1 rounded-full text-sm font-medium transition ${
                statusFilter === status
                  ? "bg-indigo-600 text-white"
                  : "bg-white border border-gray-300 text-gray-700 hover:bg-indigo-50"
              }`}
            >
              {status.toUpperCase()}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search supplier"
          value={supplierFilter}
          onChange={(e) => setSupplierFilter(e.target.value)}
          className="ml-auto px-3 py-2 border rounded-lg text-gray-700 bg-white shadow-sm w-64"
        />
      </div>
      <div className="flex items-center gap-3 mr-4">
        <label className="text-sm text-gray-600">Type</label>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="select select-bordered w-40"
        >
          <option value="all">All</option>
          <option value="supplier">Supplier</option>
          <option value="modi">Modi</option>
        </select>
      </div>

      {/* Supplier Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading && !supplierFromDatabase && <p>Loading...</p>}
        {!loading && supplierFromDatabase?.length === 0 ? (
          <p className="text-gray-500 italic">No suppliers found</p>
        ) : (
          supplierFromDatabase?.map((p) => {
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
                    ? "bg-indigo-50 border-indigo-200"
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
                        ? "badge-primary"
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
              <select
                value={newSupplier.type}
                onChange={(e) =>
                  setNewSupplier({ ...newSupplier, type: e.target.value })
                }
                className="select select-bordered w-full"
              >
                <option value="supplier">Supplier</option>
                <option value="modi">Modi</option>
              </select>
            </div>
            <div className="modal-action">
              <button
                className="btn btn-outline"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className={`btn btn-primary ${
                  insertSupplierLoading ? "opacity-50 cursor-not-allowed" : ""
                }`}
                onClick={handleSaveSupplier}
                disabled={insertSupplierLoading}
                aria-busy={insertSupplierLoading}
              >
                {insertSupplierLoading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
};

export default SupplierDashboard;
