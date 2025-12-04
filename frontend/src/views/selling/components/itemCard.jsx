import React, { useState } from "react";
import { Plus } from "lucide-react";

/** Redesigned Item Card (Modern, App-Style UI) */
const ItemCard = ({ item, onAdd }) => {
  const [qty, setQty] = useState("");
  const [rate, setRate] = useState("");

  const handleAdd = () => {
    if (!qty || !rate) return;
    onAdd({ item_name: item.name, qty: Number(qty), rate: Number(rate) });
    setQty("");
    setRate("");
  };

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 w-full transition-all hover:shadow-md">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="text-base font-semibold text-gray-800">{item.name}</div>
        <div className="text-xs text-gray-400 mt-0.5">
          {item.remaining_quantity} Qty.
        </div>
      </div>

      {/* Inputs */}
      <div className="mt-4 flex items-center gap-3">
        <input
          placeholder="Qty"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
          className="w-20 px-3 py-2 rounded-xl border text-sm focus:ring-2 focus:ring-blue-300 focus:outline-none"
          type="number"
          min="0"
        />

        <input
          placeholder="Rate"
          value={rate}
          onChange={(e) => setRate(e.target.value)}
          className="w-24 px-3 py-2 rounded-xl border text-sm focus:ring-2 focus:ring-blue-300 focus:outline-none"
          type="number"
          min="0"
        />

        <button
          onClick={handleAdd}
          className="bg-blue-500 text-white p-2 rounded-xl shadow hover:bg-blue-600 transition flex items-center justify-center"
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  );
};

export default ItemCard;
