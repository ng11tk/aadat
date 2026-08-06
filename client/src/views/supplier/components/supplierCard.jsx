import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ChevronRight, AlertCircle, CheckCircle, Clock } from "lucide-react";

const SupplierCard = ({ loading, supplierFromDatabase }) => {
  const navigate = useNavigate();

  const getStatusConfig = (status) => {
    const config = {
      paid: {
        bg: "bg-emerald-50",
        border: "border-emerald-200",
        badge: "bg-emerald-100 text-emerald-700",
        icon: <CheckCircle className="w-4 h-4" />,
      },
      partial: {
        bg: "bg-amber-50",
        border: "border-amber-200",
        badge: "bg-amber-100 text-amber-700",
        icon: <Clock className="w-4 h-4" />,
      },
      due: {
        bg: "bg-red-50",
        border: "border-red-200",
        badge: "bg-red-100 text-red-700",
        icon: <AlertCircle className="w-4 h-4" />,
      },
    };
    return config[status] || config.partial;
  };

  if (loading && supplierFromDatabase.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse"
          >
            <div className="h-6 bg-gray-200 rounded w-3/4 mb-4" />
            <div className="h-4 bg-gray-100 rounded w-1/2 mb-3" />
            <div className="h-4 bg-gray-100 rounded w-2/3 mb-3" />
            <div className="h-2 bg-gray-100 rounded w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (!loading && supplierFromDatabase.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center py-16 px-6 bg-white rounded-xl border border-gray-200"
      >
        <AlertCircle className="w-12 h-12 text-gray-300 mb-3" />
        <p className="text-gray-500 text-lg font-medium">No suppliers found</p>
        <p className="text-gray-400 text-sm mt-1">
          Create a new supplier to get started
        </p>
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {supplierFromDatabase.map((supplier, index) => {
        const due = (supplier.total || 0) - (supplier.paid || 0);
        const status = due === 0 ? "paid" : due > 0 ? "partial" : "due";
        const paymentPercentage =
          supplier.total > 0
            ? ((supplier.paid / supplier.total) * 100).toFixed(0)
            : 0;
        const statusConfig = getStatusConfig(status);

        return (
          <motion.div
            key={supplier.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{
              y: -6,
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)",
            }}
            onClick={() =>
              navigate(`/suppliers/${encodeURIComponent(supplier.supplier)}`, {
                state: { supplier },
              })
            }
            className={`relative rounded-lg overflow-hidden border cursor-pointer transition-all ${statusConfig.bg} ${statusConfig.border} group bg-white`}
          >
            {/* Top accent bar */}
            <div className={`h-1 ${statusConfig.bg}`} />

            <div className="p-4">
              {/* Header */}
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="text-base font-bold text-gray-900 group-hover:text-indigo-600 transition truncate">
                    {supplier.supplier}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5 capitalize">
                    {supplier.type === "supplier" ? "Supplier" : "Modi"}
                  </p>
                </div>
                <motion.div
                  whileHover={{ x: 2 }}
                  className={`p-2 rounded-lg ${statusConfig.badge}`}
                >
                  {statusConfig.icon}
                </motion.div>
              </div>

              {/* Status Badge */}
              <div className="mb-3">
                <span
                  className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${statusConfig.badge}`}
                >
                  {status === "paid"
                    ? "Paid"
                    : status === "partial"
                      ? "Pending"
                      : "Overdue"}
                </span>
              </div>

              {/* Payment Progress */}
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
                      status === "paid"
                        ? "bg-emerald-500"
                        : status === "partial"
                          ? "bg-amber-500"
                          : "bg-red-500"
                    }`}
                  />
                </div>
              </div>

              {/* Amount Details */}
              <div className="space-y-2 mb-3 pb-3 border-t border-gray-200 pt-3">
                <div className="flex justify-between items-center">
                  <p className="text-xs text-gray-600">Total</p>
                  <p className="font-bold text-gray-900 text-sm">
                    ₹{(supplier.total || 0).toLocaleString()}
                  </p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-xs text-gray-600">Paid</p>
                  <p className="font-semibold text-emerald-600 text-sm">
                    ₹{(supplier.paid || 0).toLocaleString()}
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

              {/* CTA */}
              <motion.div
                whileHover={{ x: 4 }}
                className="flex items-center justify-between mt-3 text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <span className="text-xs font-semibold">View</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </motion.div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default SupplierCard;
