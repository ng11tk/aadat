import React, { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { Plus } from "lucide-react";
import AddItemModal from "./components/AddItemModal";
import ItemCard from "./components/ItemCard";
import {
  INSERT_UNLOADING,
  INSERT_UNLOADING_REMAINING_ITEM,
  UPDATE_UNLOADING_STATUS,
} from "../../graphql/mutation";
import { promiseResolver } from "../../utils/promisResolver";
import {
  GET_ALL_OPENING_REMAINING_ITEMS,
  GET_ALL_OPENING_UNLOADING,
} from "../../graphql/query";
import { useMutation, useQuery } from "@apollo/client/react"; // <- fixed import

const initialItem = {
  type: "supplier",
  name: "",
  amount_paid: 100,
  advance: 10,
  vehicle_number: "hr30ar4004",
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
      unit: "quintal",
      isSellable: false,
    },
  ],
};

const OpeningStock = () => {
  const [incomingItems, setIncomingItems] = useState([]);
  const [closedItems, setClosedItems] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newItem, setNewItem] = useState(initialItem);

  // mutations
  const [insertUnLoading, { loading: insertUnloadingLoading }] =
    useMutation(INSERT_UNLOADING);
  const [updateUnloadingStatus] = useMutation(UPDATE_UNLOADING_STATUS);
  const [insertUnloadingRemainingItem] = useMutation(
    INSERT_UNLOADING_REMAINING_ITEM
  );

  // queries
  const {
    data: openingQueryData = {},
    loading: openingLoading,
    error: openingError,
    refetch: refetchOpeningData,
  } = useQuery(GET_ALL_OPENING_UNLOADING, {
    variables: {
      whereUnloading: {
        isDayClose: { _eq: false },
        unloading_date: { _eq: new Date().toISOString().split("T")[0] },
      },
      whereUnloadingItems: {},
    },
    fetchPolicy: "network-only",
  });

  const {
    data: remainingQueryData = {},
    loading: remainingLoading,
    error: remainingError,
    refetch: refetchRemainingData,
  } = useQuery(GET_ALL_OPENING_REMAINING_ITEMS, {
    variables: {
      whereUnloading: {
        isDayClose: { _eq: true },
        unloading_date: { _eq: new Date().toISOString().split("T")[0] },
      },
    },
    fetchPolicy: "network-only",
  });

  // normalize query results (avoid destructuring errors)
  const openingData = openingQueryData?.opening_unloading ?? [];
  const remainingData = remainingQueryData?.opening_unloading ?? [];

  // sync incoming items when openingData changes
  useEffect(() => {
    if (Array.isArray(openingData) && openingData.length > 0) {
      console.log("🚀 ~ OpeningStock ~ openingData:", openingData);
      setIncomingItems(openingData);
    }
  }, [openingData]);

  // sync closed items when remainingData changes
  useEffect(() => {
    if (Array.isArray(remainingData) && remainingData.length > 0) {
      console.log("🚀 ~ OpeningStock ~ remainingData:", remainingData);

      // Build closedItems shape expected by ItemCard
      const result = remainingData.map((item) => {
        // item.unloading_items should exist; guard it
        const unloading_items = (item.unloading_items ?? []).map((ui) => {
          // remaining_items might be an array; take first matching remaining row quantity
          const remQty = ui.remaining_items?.[0]?.quantity ?? 0;
          return {
            // keep any existing fields, but ensure quantity reflects remaining_items
            id: ui.id,
            name: ui.name,
            rate: ui.rate,
            unit: ui.unit,
            isSellable: ui.isSellable,
            quantity: remQty,
          };
        });

        return {
          ...item,
          unloading_items,
        };
      });

      setClosedItems(result);
    }
  }, [remainingData]);

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
      advance_amount: item.amount_paid,
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
          unit: it.unit,
          isSellable: it.isSellable,
          remaining_items: {
            data: [
              {
                quantity: it.quantity,
                closing_date: new Date().toISOString().split("T")[0],
                isSellable: it.isSellable,
              },
            ],
          },
        })),
      },
      supplier_unloading: {
        data: {
          supplier_name: item.name,
          amount: totalKharcha + itemsTotalAmount,
          remaining_amount: totalKharcha + itemsTotalAmount - item.amount_paid,
          payment_status:
            totalKharcha + itemsTotalAmount - item.amount_paid <= 0
              ? "paid"
              : "partial",
          unloading_date: new Date().toISOString().split("T")[0],
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
      await refetchRemainingData();
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
  const handleDayCloseItem = async (id) => {
    try {
      const itemToClose = incomingItems.find((item) => item.id === id);
      if (!itemToClose) return;

      // 1) Update unloading status to closed
      const [updRes, updErr] = await promiseResolver(
        updateUnloadingStatus({
          variables: {
            pk_columns: { id },
            isDayClose: true,
          },
        })
      );

      if (updErr) {
        console.error("🚀 ~ handleDayCloseItem ~ update error:", updErr);
        return;
      }

      // 2) Insert remaining items (use actual quantities from unloading_items)
      const remainingObjects =
        (itemToClose.unloading_items ?? []).map((it) => ({
          quantity: Number(it.quantity) || 0,
          isSellable: it.isSellable ?? false,
          closing_date: itemToClose.unloading_date
            ? itemToClose.unloading_date
            : new Date().toISOString().split("T")[0],
          unloading_id: itemToClose.id,
          unloading_item_id: it.id,
        })) ?? [];

      if (remainingObjects.length > 0) {
        const [insRes, insErr] = await promiseResolver(
          insertUnloadingRemainingItem({
            variables: { objects: remainingObjects },
          })
        );

        if (insErr) {
          console.error(
            "🚀 ~ handleDayCloseItem ~ insert remaining error:",
            insErr
          );
          return;
        }
      }

      // 3) Update local UI immediately (optional)
      setIncomingItems((prev) => prev.filter((it) => it.id !== id));
      setClosedItems((prev) => [
        ...prev,
        {
          ...itemToClose,
          unloading_items: itemToClose.unloading_items.map((it) => ({
            ...it,
            quantity: it.quantity, // remaining quantity mapped earlier on server
          })),
        },
      ]);

      // 4) refetch to ensure server-authoritative view
      await refetchOpeningData();
      await refetchRemainingData();
    } catch (err) {
      console.error("🚀 ~ handleDayCloseItem ~ exception:", err);
    }
  };

  // Day open: set isDayClose false and refetch (optionally delete remaining items)
  const handleDayOpenItem = async (id) => {
    try {
      const itemToOpen = closedItems.find((item) => item.id === id);
      if (!itemToOpen) return;

      const [res, err] = await promiseResolver(
        updateUnloadingStatus({
          variables: {
            pk_columns: { id },
            isDayClose: false,
          },
        })
      );
      if (err) {
        console.error("🚀 ~ handleDayOpenItem ~ error:", err);
        return;
      }

      // Update UI locally
      setClosedItems((prev) => prev.filter((it) => it.id !== id));
      setIncomingItems((prev) => [...prev, itemToOpen]);

      // Refetch server data
      await refetchOpeningData();
      await refetchRemainingData();
    } catch (err) {
      console.error("🚀 ~ handleDayOpenItem ~ exception:", err);
    }
  };

  if (openingLoading || remainingLoading)
    return <p className="text-sm text-gray-500">Fetching data...</p>;

  if (openingError || remainingError) {
    console.error("🚀 ~ OpeningStock ~ openingError:", openingError);
    console.error("🚀 ~ OpeningStock ~ remainingError:", remainingError);
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
      {closedItems.length === 0 ? (
        <p className="text-center text-gray-500 italic mb-8">
          No closed data available 📭
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {closedItems.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              isClosed={true}
              onDayOpen={handleDayOpenItem}
            />
          ))}
        </div>
      )}

      {/* Incoming Items */}
      <h2 className="text-2xl font-semibold text-gray-800 mb-6 flex items-center gap-2">
        🚀 Incoming Items
      </h2>
      {incomingItems.length === 0 ? (
        <p className="text-center text-gray-500 italic">
          No incoming items yet — add one 🚚
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {incomingItems.map((item) => (
            <ItemCard
              key={item.id}
              item={item}
              isClosed={false}
              onDelete={handleDeleteItem}
              onDayClose={handleDayCloseItem}
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
