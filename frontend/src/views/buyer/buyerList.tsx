import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus } from "lucide-react";
import { motion } from "framer-motion";
import { useMutation, useQuery } from "@apollo/client/react";
import { INSERT_BUYER } from "../../graphql/mutation";
import { promiseResolver } from "../../utils/promisResolver";
import { FETCH_BUYER_DETAILS } from "../../graphql/query";
import { useDebounce } from "../../utils/debounce";

const BuyerDashboard = () => {
  const navigate = useNavigate();

  // modal state
  const [buyerFilter, setBuyerFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [buyers, setBuyers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newBuyer, setNewBuyer] = useState({ name: "", contact: "" });

  const debouncedBuyerFilter = useDebounce(buyerFilter, 400);

  const whereBuyer = React.useMemo(() => {
    let w = {};
    if (statusFilter !== "all") w.payment_status = { _eq: statusFilter };
    if (debouncedBuyerFilter.trim() !== "")
      w.name = { _ilike: `%${debouncedBuyerFilter}%` };

    return w;
  }, [statusFilter, debouncedBuyerFilter]);

  // insert buyer mutation would go here
  const [insertBuyer, { loading: insetBuyerLoading }] =
    useMutation(INSERT_BUYER);

  // fetch buyers details
  const {
    data: buyersData,
    loading: buyersLoading,
    refetch: buyersRefetch,
  } = useQuery(FETCH_BUYER_DETAILS, {
    variables: { whereBuyer },
    fetchPolicy: "network-only",
  });
  const fetchedBuyers = buyersData?.buyer_buyers ?? [];
  useEffect(() => {
    if (!buyersData) return;
    setBuyers(
      fetchedBuyers.map((b: any) => ({
        id: b.id,
        name: b.name,
        total: b.total_amount,
        paid: b.total_amount - b.remaining_amount,
        contact: b.phone,
      }))
    );
  }, [fetchedBuyers]);

  // handlers

  const handleSaveBuyer = async () => {
    if (!newBuyer.name || !newBuyer.contact) return;

    // call mutation to insert buyer
    const [data, error] = await promiseResolver(
      insertBuyer({
        variables: {
          object: { name: newBuyer.name, phone: Number(newBuyer.contact) },
        },
      })
    );

    if (error) {
      console.error("Error inserting buyer:", error);
      return;
    }

    buyersRefetch();
    setNewBuyer({ name: "", contact: "" });
    setIsModalOpen(false);
  };

  const totalAmount = buyers.reduce((sum, b) => sum + (b.total || 0), 0);
  const totalPaid = buyers.reduce((sum, b) => sum + (b.paid || 0), 0);
  const totalDue = totalAmount - totalPaid;

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
        {/* Payment Status Filter */}
        <div className="flex gap-2">
          {["all", "paid", "partial"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-1 rounded-full text-sm font-medium transition
          ${
            statusFilter === status
              ? "bg-indigo-600 text-white shadow"
              : "bg-white border border-gray-300 text-gray-700 hover:bg-indigo-50"
          }`}
            >
              {status.toUpperCase()}
            </button>
          ))}
        </div>

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
        {buyersLoading && buyers.length === 0 && (
          <p className="text-gray-500 italic">Loading buyers...</p>
        )}
        {!buyersLoading && buyers.length === 0 && (
          <p className="text-gray-500 italic">No buyers found.</p>
        )}
        {buyers.map((b) => {
          const due = (b.total || 0) - (b.paid || 0);
          const status = due === 0 ? "paid" : "partial";
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
        })}
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
              <button
                className={`btn btn-primary ${
                  insetBuyerLoading ? "opacity-50 cursor-not-allowed" : ""
                }`}
                onClick={handleSaveBuyer}
                disabled={insetBuyerLoading}
                aria-busy={insetBuyerLoading}
              >
                {insetBuyerLoading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
};

export default BuyerDashboard;
