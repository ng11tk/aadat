import React, { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import AddItemModal from "./components/AddItemModal";
import ItemCard from "./components/itemCard";
import { promiseResolver } from "../../utils/promisResolver";
import { GET_ALL_OPENING_UNLOADING } from "../../graphql/query";
import { useApolloClient, useQuery } from "@apollo/client/react"; // <- fixed import
import api from "../../lib/axios";

const initialItem = {
  type: "supplier",
  name: "",
  amount_paid: 100,
  advance: 10,
  vehicle_number: "hr73ar0000",
  bhada: 10,
  isDayClose: true,
  kharcha_details: {
    commission: 0,
    labour: 0,
    market: 0,
    driver_gift: 0,
  },
  unloading_items: [
    {
      name: "ghobhi",
      rate: 10,
      quantity: 10,
      remaining_quantity: 10,
      unit: "quintal",
      isSellable: true,
    },
  ],
};

const OpeningStock = () => {
  const client = useApolloClient();
  const [incomingItems, setIncomingItems] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newItem, setNewItem] = useState(initialItem);
  const [insertUnloadingLoading, setInsertUnloadingLoading] = useState(false);

  // queries
  const {
    data: openingQueryData,
    loading: openingLoading,
    error: openingError,
    refetch: refetchOpeningData,
  } = useQuery(GET_ALL_OPENING_UNLOADING, {
    variables: {
      whereUnloading: {
        unloading_items: { remaining_quantity: { _neq: 0 } },
      },
      whereUnloadingItems: {},
    },
    fetchPolicy: "network-only",
  });

  // normalize query results (avoid destructuring errors)
  const openingData = openingQueryData?.opening_unloading ?? [];

  // sync incoming items when openingData changes
  useEffect(() => {
    if (!openingQueryData) return;
    setIncomingItems(openingData);
  }, [openingQueryData]);

  // Add new item (insert unloading with nested unloading_items and remaining_items)
  const handleAddItem = async (e) => {
    e?.preventDefault?.();
    if (
      !newItem?.unloading_items?.length ||
      !newItem.unloading_items[0].name?.trim()
    )
      return;

    setInsertUnloadingLoading(true);
    try {
      const [resOpening, errOpening] = await promiseResolver(
        api.post("/api/v1/opening/unloading/create", newItem),
      );

      if (errOpening) {
        console.error("🚀 ~ handleAddItem ~ insertion error:", errOpening);
        setInsertUnloadingLoading(false);
        return;
      }

      // success and use cache eviction
      client.cache.evict({
        fieldName: "opening_unloading",
      });
      client.cache.gc();

      // refetch both queries to sync UI
      refetchOpeningData();
      setNewItem(initialItem);
      setIsModalOpen(false);
    } catch (e) {
      console.error("🚀 ~ handleAddItem ~ exception:", e);
    } finally {
      setInsertUnloadingLoading(false);
    }
  };

  // Delete incoming item (placeholder; implement mutation if needed)
  const handleDeleteItem = (id) => {
    // Implement delete mutation if you want server-side deletion
    setIncomingItems((prev) => prev.filter((it) => it.id !== id));
  };

  // Day close: update unloading isDayClose true and insert remaining_items
  const handleCloseItems = async (id) => {
    try {
      const itemToClose = incomingItems.find((item) => item.id === id);
      if (!itemToClose) return;

      // update unloading isDayClose status
      const [updRes, updErr] = await promiseResolver(
        api.put(`/api/v1/opening/unloading/update/${id}`, {
          isDayClose: !itemToClose.isDayClose,
        }),
      );

      if (updErr) {
        console.error("🚀 ~ handleCloseItems ~ update error:", updErr);
        return;
      }

      // success: evict cache and refetch
      client.cache.evict({
        fieldName: "opening_unloading",
      });
      client.cache.gc(); // cleanup orphaned fields
    } catch (err) {
      console.error("🚀 ~ handleCloseItems ~ exception:", err);
    }
  };

  if (openingError) {
    console.error("🚀 ~ OpeningStock ~ openingError:", openingError);
    return <p className="text-sm text-red-500">Error fetching data</p>;
  }

  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-50 via-white to-indigo-100 p-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-4xl font-extrabold text-gray-800 tracking-tight">
          📦 Opening Stock
        </h1>
        <div className="flex items-center gap-4">
          <span className="text-lg text-gray-600 font-medium bg-white px-4 py-2 rounded-lg shadow">
            {new Date().toLocaleDateString()}
          </span>
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 text-white font-semibold shadow-lg hover:bg-indigo-700 hover:shadow-xl transition-all"
          >
            <Plus className="w-5 h-5" />
            Add Incoming
          </button>
        </div>
      </div>

      {/* Cards */}
      {openingLoading && (
        <p className="text-sm text-gray-500">Fetching data...</p>
      )}
      {!openingLoading && (
        <>
          {/* Closed Items */}
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
            ✅ Closed Items
          </h2>
          {incomingItems.filter((item) => item.isDayClose).length === 0 ? (
            <p className="text-center text-gray-500 italic mb-8">
              No closed data available 📭
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {incomingItems
                .filter((item) => item.isDayClose)
                .map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    isClosed={true}
                    onDayOpen={handleCloseItems}
                  />
                ))}
            </div>
          )}

          {/* Incoming Items */}
          <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
            🚀 Incoming Items
          </h2>
          {incomingItems.filter((item) => !item.isDayClose).length === 0 ? (
            <p className="text-center text-gray-500 italic">
              No incoming items yet — add one 🚚
            </p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {incomingItems
                .filter((item) => !item.isDayClose)
                .map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    isClosed={false}
                    onDelete={handleDeleteItem}
                    onDayClose={handleCloseItems}
                  />
                ))}
            </div>
          )}
        </>
      )}

      {/* Modal */}
      {isModalOpen && (
        <AnimatePresence>
          <AddItemModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            onAdd={handleAddItem}
            newItem={newItem}
            setNewItem={setNewItem}
            insertUnloadingLoading={insertUnloadingLoading}
          />
        </AnimatePresence>
      )}
    </div>
  );
};

export default OpeningStock;
