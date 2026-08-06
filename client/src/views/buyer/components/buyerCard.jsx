import React from "react";
import { motion } from "framer-motion";
import { AlertCircle, ChevronRight, CheckCircle2, Clock } from "lucide-react";

const BuyerCard = ({ loading, buyers, navigate }) => {
  if (!loading && buyers.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-16 px-6 bg-white rounded-xl border border-gray-200"
      >
        <AlertCircle className="w-12 h-12 text-gray-300 mb-3" />
        <p className="text-gray-500 text-lg font-medium">No buyers found</p>
        <p className="text-gray-400 text-sm mt-1">
          Create a new buyer to get started
        </p>
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {buyers.map((buyer, index) => {
        const due = (buyer.total || 0) - (buyer.paid || 0);
        const status = due === 0 ? "paid" : "partial";
        const isPaid = status === "paid";
        const paymentPercentage =
          (buyer.total || 0) > 0
            ? ((buyer.paid / buyer.total) * 100).toFixed(0)
            : 0;

        return (
          <motion.div
            key={buyer.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{
              y: -6,
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
            onClick={() =>
              navigate(`/buyers/${encodeURIComponent(buyer.name)}`, {
                state: { buyer },
              })
            }
            className={`relative rounded-lg overflow-hidden border cursor-pointer transition-all ${
              isPaid
                ? "bg-emerald-50 border-emerald-200"
                : "bg-white border-gray-200 hover:shadow-lg"
            } group`}
          >
            <div
              className={`h-1 ${isPaid ? "bg-emerald-500" : "bg-amber-500"}`}
            />

            <div className="p-5">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-base font-bold text-gray-900 group-hover:text-indigo-600 transition truncate">
                    {buyer.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {buyer.contact || "—"}
                  </p>
                </div>
                <div
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    isPaid
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {isPaid ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <Clock className="h-3.5 w-3.5" />
                  )}
                  {isPaid ? "Paid" : "Pending"}
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between items-center mb-1.5">
                  <p className="text-xs text-gray-600 font-medium">Progress</p>
                  <p className="text-xs font-bold text-gray-900">
                    {paymentPercentage}%
                  </p>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${paymentPercentage}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className={`h-2 rounded-full ${
                      isPaid ? "bg-emerald-500" : "bg-amber-500"
                    }`}
                  />
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between items-center">
                  <p className="text-xs text-gray-600">Total</p>
                  <p className="font-bold text-gray-900 text-sm">
                    ₹{(buyer.total || 0).toLocaleString()}
                  </p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-xs text-gray-600">Paid</p>
                  <p className="font-semibold text-emerald-600 text-sm">
                    ₹{(buyer.paid || 0).toLocaleString()}
                  </p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-xs text-gray-600">Due</p>
                  <p
                    className={`font-semibold text-sm ${due === 0 ? "text-gray-400" : "text-red-600"}`}
                  >
                    ₹{due.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity pt-3 border-t border-gray-200">
                <span className="text-xs font-semibold">View</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default BuyerCard;
