import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { X, User, Phone, Building2 } from "lucide-react";

const AddBuyer = ({
  setIsModalOpen,
  newBuyer,
  setNewBuyer,
  insertBuyerLoading,
  handleSaveBuyer,
}) => {
  const [errors, setErrors] = useState({ name: "", contact: "" });

  const validateContact = (value) => {
    const digits = (value || "").replace(/\D/g, "");
    if (!digits) return "Contact is required";
    if (digits.length < 10) return "Enter at least 10 digits";
    if (digits.length > 10) return "Too many digits";
    return "";
  };

  const validateBuyerName = (value) => {
    if (!value || !value.trim()) return "Buyer name is required";
    return "";
  };

  const close = () => setIsModalOpen(false);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  const onSave = () => {
    const nameError = validateBuyerName(newBuyer.name);
    const contactError = validateContact(newBuyer.contact);

    if (nameError || contactError) {
      setErrors({ name: nameError, contact: contactError });
      return;
    }

    handleSaveBuyer({
      ...newBuyer,
      name: newBuyer.name.trim(),
    });
  };

  const hasErrors =
    !!errors.name ||
    !!errors.contact ||
    !newBuyer.name?.trim() ||
    !newBuyer.contact;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-label="Add new buyer"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 8 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 8 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative bg-gradient-to-br from-indigo-600 to-indigo-700 px-6 pt-6 pb-2">
          <button
            onClick={close}
            className="absolute top-4 right-4 text-indigo-100 hover:text-white transition"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-2 mb-3">
            <Building2 className="h-5 w-5 text-white" />
            <h3 className="font-semibold text-xl text-white">Add New Buyer</h3>
          </div>
        </div>

        <div className="px-6 pt-5 pb-2 -mt-4">
          <div className="bg-white rounded-xl space-y-4">
            <div>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  id="buyer-name"
                  type="text"
                  placeholder="e.g. Ravi Traders"
                  aria-label="Buyer name"
                  className={`w-full pl-9 pr-3 py-2.5 rounded-lg border text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 transition ${
                    errors.name
                      ? "border-red-300 focus:ring-red-200"
                      : "border-gray-200 focus:ring-indigo-200 focus:border-indigo-400"
                  }`}
                  value={newBuyer.name}
                  onChange={(e) =>
                    setNewBuyer({ ...newBuyer, name: e.target.value })
                  }
                  onBlur={(e) =>
                    setErrors((s) => ({
                      ...s,
                      name: validateBuyerName(e.target.value),
                    }))
                  }
                  aria-invalid={!!errors.name}
                />
              </div>
              {errors.name && (
                <p className="text-xs text-red-600 mt-1.5">{errors.name}</p>
              )}
            </div>

            <div>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  id="buyer-contact"
                  type="text"
                  inputMode="tel"
                  placeholder="10-digit mobile number"
                  aria-label="Contact number"
                  className={`w-full pl-9 pr-3 py-2.5 rounded-lg border text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 transition ${
                    errors.contact
                      ? "border-red-300 focus:ring-red-200"
                      : "border-gray-200 focus:ring-indigo-200 focus:border-indigo-400"
                  }`}
                  value={newBuyer.contact}
                  onChange={(e) =>
                    setNewBuyer({ ...newBuyer, contact: e.target.value })
                  }
                  onBlur={(e) =>
                    setErrors((s) => ({
                      ...s,
                      contact: validateContact(e.target.value),
                    }))
                  }
                  aria-invalid={!!errors.contact}
                />
              </div>
              {errors.contact && (
                <p className="text-xs text-red-600 mt-1.5">{errors.contact}</p>
              )}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 flex gap-2">
          <button
            className="flex-1 py-2.5 rounded-lg border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition"
            onClick={close}
          >
            Cancel
          </button>
          <button
            className="flex-1 py-2.5 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
            onClick={onSave}
            disabled={insertBuyerLoading || hasErrors}
          >
            {insertBuyerLoading && (
              <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {insertBuyerLoading ? "Saving..." : "Save Buyer"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AddBuyer;
