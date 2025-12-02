import React, { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import AddItemModal from "./components/AddItemModal";
import ItemCard from "./components/ItemCard";
import {
  INSERT_UNLOADING,
  UPDATE_UNLOADING_STATUS,
} from "../../graphql/mutation";
import { promiseResolver } from "../../utils/promisResolver";
import {
  FETCH_MODI_ITEMS,
  GET_ALL_OPENING_UNLOADING,
} from "../../graphql/query";
import { useMutation, useQuery } from "@apollo/client/react"; // <- fixed import

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
  const [incomingItems, setIncomingItems] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newItem, setNewItem] = useState(initialItem);

  // mutations
  const [insertUnLoading, { loading: insertUnloadingLoading }] =
    useMutation(INSERT_UNLOADING);
  const [updateUnloadingStatus] = useMutation(UPDATE_UNLOADING_STATUS);

  // queries
  const {
    data: openingQueryData,
    loading: openingLoading,
    error: openingError,
    refetch: refetchOpeningData,
  } = useQuery(GET_ALL_OPENING_UNLOADING, {
    variables: {
      whereUnloading: {
        unloading_date: { _eq: new Date().toISOString().split("T")[0] },
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

    const totalKharcha = Object.values(newItem.kharcha_details).reduce(
      (sum, val) => sum + (Number(val) || 0),
      0
    );

    const itemsTotalAmount = newItem.unloading_items.reduce(
      (sum, it) => sum + (Number(it.rate) || 0) * (Number(it.quantity) || 0),
      0
    );

    const item = {
      ...newItem,
      amount_paid: Number(newItem.amount_paid) || 0,
      advance: Number(newItem.advance) || 0,
      unloading_items: newItem.unloading_items.map((it) => ({
        ...it,
        rate: Number(it.rate) || 0,
        quantity: Number(it.quantity) || 0,
        remaining_quantity: Number(it.quantity) || 0,
      })),
      kharcha_details: {
        commission: Number(newItem.kharcha_details.commission) || 0,
        labour: Number(newItem.kharcha_details.labour) || 0,
        market: Number(newItem.kharcha_details.market) || 0,
        driver_gift: Number(newItem.kharcha_details.driver_gift) || 0,
      },
    };

    const customObject = {
      type: item.type,
      name: item.name,
      amount: totalKharcha + itemsTotalAmount,
      advance_amount: item.advance,
      bhada_details: {
        bhada: Number(item.bhada) || 0,
        vehicle_number: item.vehicle_number,
      },
      kharcha_details: item.kharcha_details,
      unloading_date: new Date().toISOString().split("T")[0],
      isDayClose: true,
      unloading_items: {
        data: item.unloading_items.map((it) => ({
          name: it.name,
          rate: it.rate,
          quantity: it.quantity,
          remaining_quantity: it.quantity,
          unit: it.unit,
          isSellable: it.isSellable,
        })),
      },
      supplier_unloading: {
        data: {
          supplier_name: item.name,
          amount: totalKharcha + itemsTotalAmount,
          remaining_amount: totalKharcha + itemsTotalAmount - item.advance,
          payment_status:
            totalKharcha + itemsTotalAmount - item.advance <= 0
              ? "paid"
              : "partial",
          unloading_date: new Date().toISOString().split("T")[0],
          advance_amount: item.advance,
        },
      },
    };

    try {
      const [res, err] = await promiseResolver(
        insertUnLoading({
          variables: { object: customObject },
        })
      );
      if (err) {
        console.error("🚀 ~ handleAddItem ~ error:", err);
        return;
      }
      // refetch both queries to sync UI
      await refetchOpeningData();
      setNewItem(initialItem);
      setIsModalOpen(false);
    } catch (e) {
      console.error("🚀 ~ handleAddItem ~ exception:", e);
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

      // 1) Update unloading status to closed
      const [updRes, updErr] = await promiseResolver(
        updateUnloadingStatus({
          variables: {
            pk_columns: { id },
            isDayClose: !itemToClose.isDayClose,
          },
          refetchQueries: [
            {
              query: FETCH_MODI_ITEMS,
              variables: {
                unloading_date: new Date().toISOString().split("T")[0],
                isDayClose: false,
              },
            },
          ],
        })
      );

      if (updErr) {
        console.error("🚀 ~ handleCloseItems ~ update error:", updErr);
        return;
      }

      // 2) refetch to ensure server-authoritative view
      await refetchOpeningData();
    } catch (err) {
      console.error("🚀 ~ handleCloseItems ~ exception:", err);
    }
  };

  if (openingLoading)
    return <p className="text-sm text-gray-500">Fetching data...</p>;

  if (openingError) {
    console.error("🚀 ~ OpeningStock ~ openingError:", openingError);
    return <p className="text-sm text-red-500">Error fetching data</p>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-indigo-100 p-8">
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
