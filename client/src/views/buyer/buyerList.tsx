import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Search, Filter } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useApolloClient, useQuery } from "@apollo/client/react";
import { promiseResolver } from "../../utils/promisResolver";
import { FETCH_BUYERS_LIST } from "../../graphql/query";
import { useDebounce } from "../../utils/debounce";
import api from "../../lib/axios";
import PaymentStatusFilter from "../../components/paymentStatusFilter";
import AddBuyer from "./components/modals/addBuyer";
import BuyerCard from "./components/buyerCard";

const BuyerDashboard = () => {
  const navigate = useNavigate();
  const client = useApolloClient();

  // modal state
  const [buyerFilter, setBuyerFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("partial");
  const [buyers, setBuyers] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newBuyer, setNewBuyer] = useState({ name: "", contact: "" });
  const [insetBuyerLoading, setInsetBuyerLoading] = useState(false);

  const debouncedBuyerFilter = useDebounce(buyerFilter, 400);

  const whereBuyer = {
    ...(statusFilter !== "all" && { payment_status: { _eq: statusFilter } }),
    ...(debouncedBuyerFilter.trim() !== "" && {
      name: { _ilike: `%${debouncedBuyerFilter}%` },
    }),
  };

  // fetch buyers details
  const { data: buyersData, loading: buyersLoading } = useQuery(
    FETCH_BUYERS_LIST,
    {
      variables: { whereBuyer },
      // fetchPolicy: "network-only",
    },
  );
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
      })),
    );
  }, [fetchedBuyers]);

  //* handlers
  const handleSaveBuyer = async () => {
    if (!newBuyer.name || !newBuyer.contact) return;

    const digits = (newBuyer.contact || "").toString().replace(/\D/g, "");

    setInsetBuyerLoading(true);

    const [, err] = await promiseResolver(
      api.post("/api/v1/buyers/buyer", {
        name: newBuyer.name,
        phone: digits,
      }),
    );

    setInsetBuyerLoading(false);

    client.cache.evict({
      fieldName: "buyer_buyers",
    });

    client.cache.gc();

    if (err) {
      console.error("Error inserting buyer:", err);
      return;
    }

    setNewBuyer({ name: "", contact: "" });
    setIsModalOpen(false);
  };

  const totalAmount = buyers.reduce((sum, b) => sum + (b.total || 0), 0);
  const totalPaid = buyers.reduce((sum, b) => sum + (b.paid || 0), 0);
  const totalDue = totalAmount - totalPaid;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-lg">B</span>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  Buyer Dashboard
                </h1>
                <p className="text-xs text-gray-500">Manage & track buyers</p>
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

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            whileHover={{ y: -5 }}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition"
          >
            <p className="text-gray-600 text-sm font-medium mb-2">
              Total Sales
            </p>
            <h2 className="text-3xl font-bold text-indigo-600">
              ₹{totalAmount.toLocaleString()}
            </h2>
            <p className="text-xs text-gray-400 mt-2">
              From {buyers.length} buyers
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

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Filter className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-semibold text-gray-700">Filters</h3>
          </div>

          <div className="flex flex-col lg:flex-row gap-3 items-start lg:items-center lg:justify-between">
            <div className="w-full lg:w-auto">
              <PaymentStatusFilter
                statusFilter={statusFilter}
                setStatusFilter={setStatusFilter}
              />
            </div>

            <div className="relative w-full lg:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search buyer..."
                value={buyerFilter}
                onChange={(e) => setBuyerFilter(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
              />
            </div>
          </div>
        </div>

        <AnimatePresence>
          <BuyerCard
            loading={buyersLoading}
            buyers={buyers}
            navigate={navigate}
          />
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <AddBuyer
            setIsModalOpen={setIsModalOpen}
            newBuyer={newBuyer}
            setNewBuyer={setNewBuyer}
            insertBuyerLoading={insetBuyerLoading}
            handleSaveBuyer={handleSaveBuyer}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default BuyerDashboard;
