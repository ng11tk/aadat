import React from "react";
import { X, Check } from "lucide-react";

const SellCard = ({ item, onCancel, onConfirm, onUpdateQuantity }) => {
  return (
    <div className="bg-white shadow-md rounded-2xl p-6 border border-gray-200 relative">
      <h2 className="text-lg font-semibold text-gray-900">
        {item.name}{" "}
        <span className="text-sm text-indigo-600 ml-2">{item.modi}</span>
      </h2>
      <div className="mt-3 flex items-center gap-2">
        <input
          type="number"
          value={item.quantity}
          onChange={(e) => onUpdateQuantity(item.id, e.target.value)}
          className="w-20 px-2 py-1 border border-gray-300 rounded-lg text-gray-900"
        />
        <span className="text-gray-700">{item.unit}</span>
      </div>
      <div className="flex justify-end gap-2 mt-4">
        <button
          onClick={() => onCancel(item.id)}
          className="flex items-center gap-1 px-3 py-1 rounded-lg border border-red-400 text-red-600 hover:bg-red-50"
        >
          <X className="w-4 h-4" /> Cancel
        </button>
        <button
          onClick={() => onConfirm(item.id)}
          className="flex items-center gap-1 px-3 py-1 rounded-lg border border-green-500 text-green-600 hover:bg-green-50"
        >
          <Check className="w-4 h-4" /> Add
        </button>
      </div>
    </div>
  );
};

export default SellCard;
