import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { X, User, Phone, Store, Building2 } from "lucide-react";

const AddSupplier = ({
  setIsModalOpen,
  newSupplier,
  setNewSupplier,
  insertSupplierLoading,
  handleSaveSupplier,
}) => {
  const [errors, setErrors] = useState({ supplier: "", contact: "" });

  const validateContact = (value) => {
    const digits = (value || "").replace(/\D/g, "");
    if (!digits) return "Contact is required";
    if (digits.length < 10) return "Enter at least 10 digits";
    if (digits.length > 10) return "Too many digits";
    return "";
  };

  const validateSupplierName = (value) => {
    if (!value || !value.trim()) return "Supplier name is required";
    return "";
  };

  const close = () => setIsModalOpen(false);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSave = () => {
    const supplierError = validateSupplierName(newSupplier.supplier);
    const contactError = validateContact(newSupplier.contact);

    if (supplierError || contactError) {
      setErrors({ supplier: supplierError, contact: contactError });
      return;
    }

    handleSaveSupplier({
      ...newSupplier,
      supplier: newSupplier.supplier.trim(),
    });
  };

  const hasErrors =
    !!errors.supplier ||
    !!errors.contact ||
    !newSupplier.supplier?.trim() ||
    !newSupplier.contact;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-label="Add new supplier"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 8 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 8 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
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
            <h3 className="font-semibold text-xl text-white">
              Add New Supplier
            </h3>
          </div>
        </div>

        {/* Form */}
        <div className="px-6 pt-5 pb-2 -mt-4">
          <div className="bg-white rounded-xl space-y-4">
            {/* Supplier Name */}
            <div>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  id="supplier-name"
                  type="text"
                  placeholder="e.g. Sharma Traders"
                  aria-label="Supplier name"
                  className={`w-full pl-9 pr-3 py-2.5 rounded-lg border text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 transition ${
                    errors.supplier
                      ? "border-red-300 focus:ring-red-200"
                      : "border-gray-200 focus:ring-indigo-200 focus:border-indigo-400"
                  }`}
                  value={newSupplier.supplier}
                  onChange={(e) =>
                    setNewSupplier({ ...newSupplier, supplier: e.target.value })
                  }
                  onBlur={(e) =>
                    setErrors((s) => ({
                      ...s,
                      supplier: validateSupplierName(e.target.value),
                    }))
                  }
                  aria-invalid={!!errors.supplier}
                />
              </div>
              {errors.supplier && (
                <p className="text-xs text-red-600 mt-1.5">{errors.supplier}</p>
              )}
            </div>

            {/* Contact */}
            <div>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  id="supplier-contact"
                  type="text"
                  inputMode="tel"
                  placeholder="10-digit mobile number"
                  aria-label="Contact number"
                  className={`w-full pl-9 pr-3 py-2.5 rounded-lg border text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 transition ${
                    errors.contact
                      ? "border-red-300 focus:ring-red-200"
                      : "border-gray-200 focus:ring-indigo-200 focus:border-indigo-400"
                  }`}
                  value={newSupplier.contact}
                  onChange={(e) =>
                    setNewSupplier({ ...newSupplier, contact: e.target.value })
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

            {/* Type — pill toggle instead of a plain dropdown */}
            <div role="group" aria-label="Supplier type">
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "supplier", label: "Supplier", icon: Store },
                  { value: "modi", label: "Modi", icon: Building2 },
                ].map(({ value, label, icon: Icon }) => {
                  const active = newSupplier.type === value;
                  return (
                    <button
                      key={value}
                      type="button"
                      onClick={() =>
                        setNewSupplier({ ...newSupplier, type: value })
                      }
                      aria-pressed={active}
                      className={`flex items-center justify-center gap-1.5 py-2.5 rounded-lg border text-sm font-medium transition ${
                        active
                          ? "border-indigo-500 bg-indigo-50 text-indigo-700"
                          : "border-gray-200 text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
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
            disabled={insertSupplierLoading || hasErrors}
          >
            {insertSupplierLoading && (
              <span className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            )}
            {insertSupplierLoading ? "Saving..." : "Save Supplier"}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default AddSupplier;
