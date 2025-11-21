import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import SummaryModal from "./components/summary";
import ItemCard from "./components/itemCard";

/** SAMPLE DATA **/
const SAMPLE_MODI_LIST = [
  { id: 1, modi_name: "Modi A", items: ["Sugar", "Rice", "Wheat"], weight: 20 },
  { id: 2, modi_name: "Modi B", items: ["Rice", "Salt"], weight: 15 },
  { id: 3, modi_name: "Modi C", items: ["Oil", "Ghee"], weight: 10 },
];
const SAMPLE_BUYERS = [
  { id: "b1", buyer_name: "Buyer One" },
  { id: "b2", buyer_name: "Buyer Two" },
  { id: "b3", buyer_name: "Buyer Three" },
];

const SellDashboard = () => {
  const [modiList] = useState(SAMPLE_MODI_LIST);
  const [buyers] = useState(SAMPLE_BUYERS);
  const [buyerDropdownOpen, setBuyerDropdownOpen] = useState(false);
  const [selectedModi, setSelectedModi] = useState(null);
  const [selectedBuyer, setSelectedBuyer] = useState(null);
  const [addedItems, setAddedItems] = useState([]);

  const totalAmount = useMemo(
    () =>
      addedItems.reduce((sum, it) => sum + (it.qty || 0) * (it.rate || 0), 0),
    [addedItems]
  );

  const handleAddItem = (payload) => {
    setAddedItems((prev) => {
      const idx = prev.findIndex(
        (p) =>
          p.modi_id === payload.modi_id &&
          p.item_name === payload.item_name &&
          Number(p.rate) === Number(payload.rate)
      );

      if (idx >= 0) {
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          qty: Number(next[idx].qty) + Number(payload.qty),
        };
        return next;
      }

      return [...prev, payload];
    });
  };

  const handleDeleteItem = (index) =>
    setAddedItems((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = () => {
    if (!selectedBuyer) return alert("Select a buyer first.");
    if (addedItems.length === 0) return alert("Add at least one item.");

    const payload = {
      buyer_id: selectedBuyer,
      items: addedItems,
      total: totalAmount,
      sell_date: new Date().toISOString(),
    };

    console.log("✔ Submit Payload", payload);
    alert("Submitted. Check console.");

    setAddedItems([]);
    setSelectedBuyer(null);
    setSelectedModi(null);
  };

  return (
    <div className="p-6 bg-white min-h-screen text-gray-900">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Sell Dashboard</h1>

        {/* Buyer Select */}
        <div className="relative w-60">
          <label className="block text-sm font-semibold mb-1">
            Select Buyer
          </label>
          <div
            className="bg-white border rounded-xl p-3 shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md transition-all"
            onClick={() => setBuyerDropdownOpen(!buyerDropdownOpen)}
          >
            <span className="text-gray-700">
              {buyers.find((b) => b.id === selectedBuyer)?.buyer_name ||
                "Choose Buyer"}
            </span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>

          {buyerDropdownOpen && (
            <div className="absolute top-full left-0 right-0 bg-white shadow-lg rounded-xl border mt-1 z-20 max-h-60 overflow-auto">
              {buyers.map((b) => (
                <div
                  key={b.id}
                  className="p-3 hover:bg-gray-100 cursor-pointer text-sm"
                  onClick={() => {
                    setSelectedBuyer(b.id);
                    setBuyerDropdownOpen(false);
                  }}
                >
                  {b.buyer_name}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* GRID LAYOUT */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* LEFT: MODI LIST */}
        <div className="bg-gray-50 shadow rounded-xl p-4 border border-gray-200">
          <h2 className="text-lg font-semibold mb-4">Modi List</h2>

          <ul className="space-y-2">
            {modiList.map((m) => (
              <li
                key={m.id}
                className={`p-3 rounded-lg cursor-pointer border flex justify-between items-center ${
                  selectedModi?.id === m.id
                    ? "bg-indigo-100 border-indigo-400"
                    : "bg-white border-gray-200"
                }`}
                onClick={() => setSelectedModi(m)}
              >
                <div>
                  <div className="font-medium">{m.modi_name}</div>
                  <div className="text-xs text-gray-500">
                    {m.items.length} items
                  </div>
                </div>
                <span className="text-sm text-gray-600">{m.weight}kg</span>
              </li>
            ))}
          </ul>
        </div>

        {/* RIGHT 2 COLUMNS */}
        <div className="col-span-2">
          {/* SHOW ITEMS */}
          {selectedModi && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {selectedModi.items.map((item) => (
                <ItemCard
                  key={item}
                  modi={selectedModi}
                  itemName={item}
                  onAdd={(payload) =>
                    handleAddItem({
                      modi_id: selectedModi.id,
                      modi_name: selectedModi.modi_name,
                      item_name: payload.item_name,
                      qty: Number(payload.qty),
                      rate: Number(payload.rate),
                      weight: selectedModi.weight,
                    })
                  }
                />
              ))}
            </div>
          )}

          {/* SUMMARY CARD */}
          <div className="bg-gray-100 p-4 rounded-lg border mb-6 flex justify-between items-center">
            <span className="font-semibold text-gray-800">
              Total: <span className="text-indigo-600">₹{totalAmount}</span>
            </span>
            <span className="font-semibold text-gray-800">
              Items:{" "}
              <span className="text-indigo-600">{addedItems.length}</span>
            </span>
          </div>

          {/* ACTIONS */}
          <div className="flex gap-4">
            <button
              onClick={() =>
                document.getElementById("open-summary-btn")?.click()
              }
              className="px-6 py-2 bg-gray-700 text-white rounded-lg shadow hover:bg-gray-800 disabled:opacity-40"
              disabled={addedItems.length === 0}
            >
              Summary
            </button>

            <button
              onClick={handleSubmit}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 disabled:opacity-40"
              disabled={!selectedBuyer || addedItems.length === 0}
            >
              Submit
            </button>
          </div>
        </div>
      </div>

      <button id="open-summary-btn" className="sr-only" />
      <SummaryModal
        items={addedItems}
        onDeleteItem={handleDeleteItem}
        openById="open-summary-btn"
      />
    </div>
  );
};

export default SellDashboard;
