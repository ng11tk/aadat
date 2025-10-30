/* SummarySection.jsx */
import React, { useMemo, useState } from "react";

const SummarySection = ({ confirmedItems = [], buyer, onSave }) => {
  const [rates, setRates] = useState({});
  const [isCash, setIsCash] = useState(false);
  const [cashAmount, setCashAmount] = useState("");

  // Group and aggregate items
  const groups = useMemo(() => {
    const grouped = {};
    confirmedItems.forEach((item) => {
      if (!grouped[item.modi]) grouped[item.modi] = {};
      const key = item.name;
      if (!grouped[item.modi][key]) {
        grouped[item.modi][key] = {
          name: item.name,
          unit: item.unit,
          quantity: 0,
        };
      }
      grouped[item.modi][key].quantity += Number(item.quantity || 0);
    });
    return Object.entries(grouped).map(([modi, items]) => ({
      modi,
      items: Object.values(items),
    }));
  }, [confirmedItems]);

  // Compute totals
  const computed = useMemo(() => {
    let grandTotalQty = 0;
    let grandTotalAmount = 0;
    const groupsWithTotals = groups.map((g) => {
      let groupTotal = 0;
      const items = g.items.map((it) => {
        const rate = rates[g.modi]?.[it.name] || 0;
        const total = it.quantity * rate;
        groupTotal += total;
        return { ...it, rate, total };
      });
      grandTotalQty += items.reduce((s, it) => s + it.quantity, 0);
      grandTotalAmount += groupTotal;
      return { modi: g.modi, items, groupTotal };
    });
    return { groupsWithTotals, grandTotalQty, grandTotalAmount };
  }, [groups, rates]);

  const handleRateChange = (modi, itemName, val) => {
    const num = val === "" ? "" : Number(val);
    setRates((prev) => ({
      ...prev,
      [modi]: { ...(prev[modi] || {}), [itemName]: num },
    }));
  };

  const handleSave = () => {
    const payload = {
      buyer,
      groups: computed.groupsWithTotals,
      grandTotalQty: computed.grandTotalQty,
      grandTotalAmount: computed.grandTotalAmount,
      isCash,
      cashAmount: isCash ? Number(cashAmount || 0) : 0,
      rates,
    };
    console.log("🚀 ~ handleSave ~ payload:", payload);
    if (onSave) onSave(payload);
  };

  return (
    <div className="mt-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Summary</h2>

      {groups.length === 0 ? (
        <p className="text-gray-500 italic">No confirmed items</p>
      ) : (
        groups.map((g) => (
          <div
            key={g.modi}
            className="bg-white shadow-md rounded-2xl p-6 border border-gray-200 mb-6"
          >
            {/* Header */}
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Modi: <span className="text-indigo-600">{g.modi}</span>
            </h3>

            {/* Items */}
            <div className="space-y-3">
              {g.items.map((it) => (
                <div
                  key={it.name}
                  className="flex justify-between items-center bg-indigo-50 p-3 rounded-lg border border-indigo-100"
                >
                  <div>
                    <div className="text-gray-800 font-medium">{it.name}</div>
                    <div className="text-sm text-gray-600">
                      {it.quantity} {it.unit}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      placeholder="Rate"
                      value={rates[g.modi]?.[it.name] ?? ""}
                      onChange={(e) =>
                        handleRateChange(g.modi, it.name, e.target.value)
                      }
                      className="w-24 px-2 py-1 border border-gray-300 rounded-lg text-gray-900"
                    />
                    <span className="font-semibold text-gray-800">
                      ₹{" "}
                      {(it.quantity * (rates[g.modi]?.[it.name] || 0)).toFixed(
                        2
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Modi total */}
            <div className="mt-4 text-right font-semibold text-gray-800">
              Modi Total: ₹{" "}
              {computed.groupsWithTotals
                .find((x) => x.modi === g.modi)
                ?.groupTotal.toFixed(2) || "0.00"}
            </div>
          </div>
        ))
      )}

      {groups.length > 0 && (
        <div className="bg-white shadow-md rounded-2xl p-6 border border-gray-200">
          {/* Cash */}
          <div className="flex items-center gap-3 mb-4">
            <input
              id="cash"
              type="checkbox"
              checked={isCash}
              onChange={(e) => setIsCash(e.target.checked)}
              className="w-4 h-4 text-indigo-600 border-gray-300 rounded"
            />
            <label htmlFor="cash" className="text-gray-700">
              Cash
            </label>
            {isCash && (
              <input
                type="number"
                placeholder="Cash amount"
                value={cashAmount}
                onChange={(e) => setCashAmount(e.target.value)}
                className="ml-3 px-3 py-1 border rounded-lg text-gray-900"
              />
            )}
          </div>

          {/* Totals */}
          <div className="text-right">
            <div className="text-gray-800 font-medium">
              Grand Qty: {computed.grandTotalQty}
            </div>
            <div className="text-gray-900 font-bold text-xl">
              Grand Total: ₹ {computed.grandTotalAmount.toFixed(2)}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end mt-6 gap-3">
            <button
              onClick={() => onSave && onSave(null)}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Skip
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700"
            >
              Add
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SummarySection;
