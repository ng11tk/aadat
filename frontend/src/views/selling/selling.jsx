import React, { useState } from "react";
import { Plus } from "lucide-react";
import { AnimatePresence } from "framer-motion";
import SellCard from "./components/sellCard";
import ConfirmedItemsDropdown from "./components/ConfirmedItemsDropdown";
import SummarySection from "./components/SummarySection";
import SellModal from "./components/SellModal";

const SellPage = () => {
  const [buyer, setBuyer] = useState("Buyer A");
  const [tempItems, setTempItems] = useState([]);
  const [confirmedItems, setConfirmedItems] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Create a card
  const handleAddDefaultCard = (item) => {
    setTempItems([...tempItems, { ...item, id: Date.now(), quantity: 1 }]);
  };

  // Cancel card
  const handleCancelCard = (id) => {
    setTempItems(tempItems.filter((i) => i.id !== id));
  };

  // Confirm card
  const handleConfirmCard = (id) => {
    const card = tempItems.find((i) => i.id === id);
    if (!card) return;
    setConfirmedItems([...confirmedItems, { ...card, id: Date.now() }]);
  };

  // Update quantity
  const updateQuantity = (id, qty) => {
    setTempItems((prev) =>
      prev.map((i) => (i.id === id ? { ...i, quantity: Number(qty) } : i))
    );
  };

  // Group confirmed items by modi
  const groupedByModi = confirmedItems.reduce((acc, item) => {
    if (!acc[item.modi]) acc[item.modi] = [];
    acc[item.modi].push(item);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-indigo-100 p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Sell</h1>
        <div className="flex items-center gap-4">
          <input
            value={buyer}
            onChange={(e) => setBuyer(e.target.value)}
            placeholder="Buyer Name"
            className="px-3 py-2 border rounded-lg text-gray-900 placeholder-gray-400"
          />
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold shadow hover:bg-indigo-700 transition"
          >
            <Plus className="w-5 h-5" /> Add Item
          </button>
        </div>
      </div>

      {/* Temp Items */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {tempItems.map((item) => (
          <SellCard
            key={item.id}
            item={item}
            onCancel={handleCancelCard}
            onConfirm={handleConfirmCard}
            onUpdateQuantity={updateQuantity}
          />
        ))}
      </div>

      {/* Confirmed Items */}
      <ConfirmedItemsDropdown confirmedItems={groupedByModi} />

      {/* Summary Section */}
      <SummarySection confirmedItems={confirmedItems} buyer={buyer} />

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <SellModal
            onClose={() => setIsModalOpen(false)}
            onAdd={handleAddDefaultCard}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default SellPage;
