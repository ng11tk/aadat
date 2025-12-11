import React, { useEffect, useMemo, useState } from "react";
import SummaryModal from "./components/summary";
import ItemCard from "./components/itemCard";
import {
  FETCH_MODI_ITEMS,
  FETCH_SALES,
  FIND_SALES_ORDERS,
  GET_BUYERS,
} from "../../graphql/query";
import {
  useMutation,
  useQuery,
  useLazyQuery,
  useApolloClient,
} from "@apollo/client/react";
import {
  INSERT_SALES_ORDER_ITEMS,
  UPSERT_SALES_ORDER,
} from "../../graphql/mutation";

const SalesDashboard = () => {
  const [modiList, setModiList] = useState([]);
  const [buyers, setBuyers] = useState([]);
  const [buyerDropdownOpen, setBuyerDropdownOpen] = useState(false);
  const [selectedModi, setSelectedModi] = useState(null);
  const [selectedBuyer, setSelectedBuyer] = useState(null);
  const [addedItems, setAddedItems] = useState([]);

  // fetch buyers on load
  const { data: fetchBuyers } = useQuery(GET_BUYERS);
  const buyersData = fetchBuyers?.buyer_buyers || [];
  useEffect(() => {
    if (!fetchBuyers) return;
    const formatted = buyersData.map((b) => ({ id: b.id, buyer_name: b.name }));
    setBuyers(formatted);
  }, [fetchBuyers]);

  // fetch modi items
  const {
    data: modiData,
    loading: modiLoading,
    refetch: modiRefetch,
  } = useQuery(FETCH_MODI_ITEMS, {
    variables: {
      where: {
        isDayClose: { _eq: false },
        unloading_items: { remaining_quantity: { _neq: 0 } },
      },
    },
  });
  const modiItemsData = modiData?.opening_unloading || [];

  useEffect(() => {
    if (!modiData) return;

    const mergedByName = Object.values(
      (modiItemsData || []).reduce((acc, m) => {
        // supplier groups together, others grouped by name
        const key = m.type === "supplier" ? "supplier" : m.name;

        // prepare unloading items properly
        const items = Array.isArray(m.unloading_items)
          ? m.unloading_items.map((item) => ({
              ...item,
              supplier_name: m.name,
            }))
          : [];

        if (!acc[key]) {
          acc[key] = {
            id: m.id,
            name: m.name,
            modi_name: m.type === "supplier" ? "aadat" : m.name,
            modi_type: m.type,
            unloading_items: items,
          };
        } else {
          acc[key].unloading_items = acc[key].unloading_items.concat(items);
        }

        return acc;
      }, {})
    );

    const formatted = mergedByName.map((m) => ({
      id: m.id,
      modi_name: m.modi_name,
      items: (m.unloading_items || []).filter((it) => it.isSellable),
    }));

    setModiList(formatted);
  }, [modiData]);

  // Apollo client for imperative queries (used to always fetch fresh data)
  const client = useApolloClient();

  // mutations
  const [upsertSalesOrder] = useMutation(UPSERT_SALES_ORDER);
  const [insertSalesOrderItems] = useMutation(INSERT_SALES_ORDER_ITEMS);

  const totalAmount = useMemo(
    () =>
      addedItems.reduce(
        (sum, it) => sum + (it.weight || 0) * (it.qty || 0) * (it.rate || 0),
        0
      ),
    [addedItems]
  );

  const handleAddItem = (payload) => {
    setAddedItems((prev) => {
      const idx = prev.findIndex(
        (p) =>
          p.unloading_id === payload.unloading_id &&
          p.item_id === payload.item_id &&
          p.item_name === payload.item_name &&
          Number(p.rate) === Number(payload.rate)
      );
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = {
          ...next[idx],
          qty: Number(next[idx].qty) + Number(payload.qty),
          weight: Number(next[idx].weight) + Number(payload.weight),
        };
        return next;
      }
      return [...prev, payload];
    });
  };

  const handleDeleteItem = (index) =>
    setAddedItems((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async () => {
    if (!selectedBuyer) return alert("Select a buyer first.");
    if (addedItems.length === 0) return alert("Add at least one item.");

    const payload = {
      buyer_id: selectedBuyer,
      sales_order_items: {
        data: addedItems.map((it) => ({
          unloading_item_id: it.item_id,
          supplier_name: it.supplier_name,
          item_name: it.item_name,
          quantity: it.qty,
          unit_price: it.rate,
          item_weight: it.weight,
          item_date: new Date().toISOString().split("T")[0],
        })),
      },
      total_amount: totalAmount,
      order_date: new Date().toISOString().split("T")[0],
      items_missing_rate_count: 0,
    };
    console.log("✔ Submit Payload", payload);

    //todo: move this to backend as a transaction
    try {
      const { data: existingOrdersData } = await client.query({
        query: FIND_SALES_ORDERS,
        variables: {
          where: {
            buyer_id: { _eq: selectedBuyer },
            order_date: { _eq: new Date().toISOString().split("T")[0] },
          },
        },
        fetchPolicy: "network-only",
      });
      const existingOrder = existingOrdersData?.sales_sales_order?.[0] || false;

      if (existingOrder) {
        // Save previous total to allow rollback if item insertion fails
        const previousTotal = existingOrder.total_amount || 0;
        const updatedTotal = previousTotal + totalAmount;

        // Update the sales order total first
        const { data: updateData } = await upsertSalesOrder({
          variables: {
            object: {
              id: existingOrder.id,
              buyer_id: payload.buyer_id,
              total_amount: updatedTotal,
              order_date: payload.order_date,
              items_missing_rate_count: payload.items_missing_rate_count,
            },
          },
        });
        console.log("Sales order total updated:", updateData);
        // Then insert the new items. If this fails, attempt to rollback the total_amount.
        try {
          const { data: insertItemsData } = await insertSalesOrderItems({
            variables: {
              objects: payload.sales_order_items.data.map((it) => ({
                ...it,
                order_id: existingOrder.id,
              })),
            },
            refetchQueries: [
              {
                query: FETCH_SALES,
                variables: {
                  where: { order_date: new Date().toISOString().split("T")[0] },
                },
              },
            ],
          });
          console.log("Sales order items updated:", insertItemsData);
        } catch (insertErr) {
          console.error(
            "Failed to insert sales order items, attempting rollback:",
            insertErr
          );
          try {
            // Rollback total_amount to previous value
            const { data: rollbackData } = await upsertSalesOrder({
              variables: {
                object: {
                  id: existingOrder.id,
                  total_amount: previousTotal,
                },
              },
              refetchQueries: [
                {
                  query: FETCH_SALES,
                  variables: {
                    where: {
                      order_date: new Date().toISOString().split("T")[0],
                    },
                  },
                },
              ],
            });
            console.log("Rollback successful:", rollbackData);
          } catch (rollbackErr) {
            console.error("Rollback failed:", rollbackErr);
          }

          // Surface error to user and stop submission
          return alert(
            "Failed to add order items. The order has been rolled back (or rollback attempted). Check console."
          );
        }
      } else {
        const { data: insertData } = await upsertSalesOrder({
          variables: { object: payload },
          refetchQueries: [
            {
              query: FETCH_SALES,
              variables: {
                where: { order_date: new Date().toISOString().split("T")[0] },
              },
            },
          ],
        });
        console.log("New sales order created:", insertData);
      }
    } catch (err) {
      console.error("Error finding or creating sales order:", err);
      return alert("Error finding existing sales orders.");
    }

    alert("Submitted. Check console.");
    modiRefetch();
    setAddedItems([]);
    setSelectedBuyer(null);
    setSelectedModi(null);
  };

  return (
    <div className="p-6 bg-white min-h-screen text-gray-900">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Sell Dashboard</h1>
        <div className="relative w-60">
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-50 shadow rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Modi List</h2>
          </div>
          <ul className="space-y-2">
            {modiLoading && <p>Loading ...</p>}
            {!modiLoading && !modiList.length ? (
              <p>Modi list is empty!</p>
            ) : (
              modiList.map((m) => (
                <li
                  key={m.id}
                  className={`p-3 rounded-lg cursor-pointer border flex justify-between items-center ${
                    selectedModi?.id === m.id
                      ? "bg-indigo-100 border-indigo-400"
                      : "bg-white border-gray-200"
                  }`}
                  onClick={() => setSelectedModi(m)}
                >
                  <div className="font-medium">{m.modi_name}</div>
                  <span className="text-xs text-gray-600">
                    {m.items.length} items
                  </span>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="col-span-2">
          {selectedModi && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {selectedModi.items.map((item) => {
                return (
                  <ItemCard
                    key={item.id}
                    item={item}
                    onAdd={(payload) =>
                      handleAddItem({
                        unloading_id: selectedModi.id,
                        item_id: item.id,
                        modi_name: selectedModi.modi_name,
                        supplier_name: item.supplier_name,
                        item_name: payload.item_name,
                        qty: Number(payload.qty),
                        rate: Number(payload.rate),
                        weight: Number(payload.weight),
                      })
                    }
                  />
                );
              })}
            </div>
          )}

          <div className="bg-gray-100 p-4 rounded-lg border mb-6 flex justify-between items-center">
            <span className="font-semibold text-gray-800">
              Total: <span className="text-indigo-600">₹{totalAmount}</span>
            </span>
            <span className="font-semibold text-gray-800">
              Items:{" "}
              <span className="text-indigo-600">{addedItems.length}</span>
            </span>
          </div>

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

export default SalesDashboard;
