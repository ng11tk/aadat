// eslint-disable-next-line no-unused-vars
import { useQuery } from "@apollo/client/react";
import { motion } from "framer-motion";
import { Plus, Trash2, Package } from "lucide-react";
import { FETCH_SUPPLIERS } from "../../../graphql/query";
import { useEffect, useState } from "react";

const AddItemModal = ({
  onClose,
  onAdd,
  newItem,
  setNewItem,
  insertUnloadingLoading,
}) => {
  const [suppliers, setSuppliers] = useState([]);
  // fetch supplier list from database
  const {
    error,
    data: { supplier_supplier: supplier_supplier = [] } = {},
    loading,
  } = useQuery(FETCH_SUPPLIERS, {
    variables: { where: { type: { _eq: newItem.type } } },
  });

  // update suppliers state when data changes
  useEffect(() => {
    if (supplier_supplier && supplier_supplier.length > 0) {
      setSuppliers(supplier_supplier);
    }
  }, [supplier_supplier]);

  const handleAddMoreItem = () => {
    setNewItem({
      ...newItem,
      unloading_items: [
        ...newItem.unloading_items,
        {
          name: "ghobhi",
          rate: 10,
          quantity: 10,
          unit: "quintal",
          isSellable: true,
        },
      ],
    });
  };

  const handleRemoveItem = (index) => {
    const updatedItems = newItem.unloading_items.filter((_, i) => i !== index);
    setNewItem({ ...newItem, unloading_items: updatedItems });
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...newItem.unloading_items];
    updatedItems[index][field] = value;
    setNewItem({ ...newItem, unloading_items: updatedItems });
  };

  const handleChange = (field, value, supplier_id) => {
    setNewItem({ ...newItem, [field]: value, supplier_id: supplier_id });
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        {" "}
        Loading...
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl overflow-y-auto max-h-[90vh] text-gray-900"
      >
        {/* Gradient Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4 rounded-t-3xl flex items-center gap-3">
          <Package className="w-7 h-7" />
          <h2 className="text-2xl font-bold">Add Incoming Item</h2>
        </div>

        <form onSubmit={onAdd} className="p-6 space-y-6">
          {/* Type Selection */}
          <div className="flex gap-4 mb-6">
            <button
              type="button"
              onClick={() => handleChange("type", "supplier")}
              className={`px-6 py-2 rounded-xl font-medium shadow ${
                newItem.type === "supplier"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Aadat
            </button>
            <button
              type="button"
              onClick={() => handleChange("type", "modi")}
              className={`px-6 py-2 rounded-xl font-medium shadow ${
                newItem.type === "modi"
                  ? "bg-indigo-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Vapari
            </button>
          </div>

          {/* Party Info */}
          <div className="p-6 bg-white rounded-2xl shadow border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Party Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Supplier / Modi Name */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  {newItem.type === "supplier" ? "Supplier Name" : "Modi Name"}
                </label>
                <select
                  value={newItem.name}
                  placeholder={`Enter ${
                    newItem.type === "supplier" ? "supplier" : "modi"
                  } name`}
                  onChange={(e) => {
                    return handleChange("name", e.target.value);
                  }}
                  className="w-full border border-gray-300 rounded-lg p-3 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">
                    Select {newItem.type === "supplier" ? "Supplier" : "Modi"}
                  </option>
                  {suppliers.map((supplier) => (
                    <option key={supplier.id} value={supplier.name}>
                      {supplier.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Amount Paid / Advance */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  {newItem.type === "supplier" ? "Amount Paid" : "Advance"}
                </label>
                <input
                  type="number"
                  placeholder={
                    newItem.type === "supplier"
                      ? "Enter amount paid"
                      : "Enter advance"
                  }
                  value={
                    newItem.type === "supplier"
                      ? newItem.amount_paid
                      : newItem.advance
                  }
                  onChange={(e) =>
                    handleChange(
                      newItem.type === "supplier" ? "amount_paid" : "advance",
                      e.target.value
                    )
                  }
                  className="w-full border border-gray-300 rounded-lg p-3 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-5">
              {/* Vehicle Number */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Vehicle Number
                </label>
                <input
                  type="text"
                  placeholder="Enter vehicle number"
                  value={newItem.vehicle_number}
                  onChange={(e) =>
                    handleChange("vehicle_number", e.target.value)
                  }
                  className="w-full border border-gray-300 rounded-lg p-3 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Bhada */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Bhada
                </label>
                <input
                  type="number"
                  placeholder="Enter Bhada"
                  value={newItem.bhada}
                  onChange={(e) => handleChange("bhada", e.target.value)}
                  className="w-full border border-gray-300 rounded-lg p-3 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Kharcha Details */}
          <div className="p-6 bg-white rounded-2xl shadow border border-gray-200">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Kharcha Details
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Commission */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Commission
                </label>
                <input
                  type="number"
                  placeholder="Enter Commission"
                  value={newItem.kharcha_details?.commission || 0}
                  onChange={(e) =>
                    setNewItem({
                      ...newItem,
                      kharcha_details: {
                        ...newItem.kharcha_details,
                        commission: e.target.value,
                      },
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg p-3 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Labour */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Labour
                </label>
                <input
                  type="number"
                  placeholder="Enter Labour Charge"
                  value={newItem.kharcha_details?.labour || 0}
                  onChange={(e) =>
                    setNewItem({
                      ...newItem,
                      kharcha_details: {
                        ...newItem.kharcha_details,
                        labour: e.target.value,
                      },
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg p-3 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Market */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Market
                </label>
                <input
                  type="number"
                  placeholder="Enter Market Charge"
                  value={newItem.kharcha_details?.market || 0}
                  onChange={(e) =>
                    setNewItem({
                      ...newItem,
                      kharcha_details: {
                        ...newItem.kharcha_details,
                        market: e.target.value,
                      },
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg p-3 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              {/* Driver Gift */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">
                  Driver Gift
                </label>
                <input
                  type="number"
                  placeholder="Enter Driver Gift"
                  value={newItem.kharcha_details?.driver_gift || 0}
                  onChange={(e) =>
                    setNewItem({
                      ...newItem,
                      kharcha_details: {
                        ...newItem.kharcha_details,
                        driver_gift: e.target.value,
                      },
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg p-3 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            </div>
          </div>

          {/* Items Section */}
          <div className="space-y-5">
            {newItem?.unloading_items.map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative p-6 bg-gray-50 border border-gray-200 rounded-2xl shadow hover:shadow-md transition"
              >
                {newItem?.unloading_items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    className="absolute top-3 right-3 text-red-500 hover:text-red-700 transition"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}

                <h4 className="text-lg font-semibold text-gray-800 mb-4">
                  Item {index + 1}
                </h4>

                {/* Row 1: Item Name + Rate */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Item Name
                    </label>
                    <input
                      type="text"
                      placeholder="Enter item name"
                      value={item.name}
                      onChange={(e) =>
                        handleItemChange(index, "name", e.target.value)
                      }
                      className="w-full border border-gray-300 rounded-lg p-3 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Rate
                    </label>
                    <input
                      type="number"
                      placeholder="Enter rate"
                      value={item.rate}
                      onChange={(e) =>
                        handleItemChange(index, "rate", e.target.value)
                      }
                      className="w-full border border-gray-300 rounded-lg p-3 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                </div>

                {/* Row 2: Quantity + Unit */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Quantity
                    </label>
                    <input
                      type="number"
                      placeholder="Enter quantity"
                      value={item.quantity}
                      onChange={(e) =>
                        handleItemChange(index, "quantity", e.target.value)
                      }
                      className="w-full border border-gray-300 rounded-lg p-3 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-1">
                      Unit
                    </label>
                    <select
                      value={item.unit}
                      onChange={(e) =>
                        handleItemChange(index, "unit", e.target.value)
                      }
                      className="w-full border border-gray-300 rounded-lg p-3 text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">Select Unit</option>
                      <option value="kg">Kg</option>
                      <option value="man">Man</option>
                      <option value="quintal">Quintal</option>
                      <option value="ton">Ton</option>
                      <option value="units">Units</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Add Another Item */}
          <button
            type="button"
            onClick={handleAddMoreItem}
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-green-500 text-white hover:bg-green-600 transition font-semibold shadow"
          >
            <Plus className="w-5 h-5" /> Add Another Item
          </button>

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-100 transition font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={insertUnloadingLoading}
              className={`px-6 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold transition shadow ${
                insertUnloadingLoading
                  ? "opacity-60 cursor-not-allowed"
                  : "hover:opacity-90"
              }`}
            >
              {insertUnloadingLoading ? "Saving..." : "Save All"}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

export default AddItemModal;
