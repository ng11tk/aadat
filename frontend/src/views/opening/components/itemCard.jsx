import React from "react";
import { X, Truck, Package } from "lucide-react";

const ItemCard = ({ item, isClosed, onDelete, onDayClose, onDayOpen }) => {
  return (
    <div
      className={`rounded-2xl shadow-lg overflow-hidden transition-all transform hover:-translate-y-1 hover:shadow-2xl 
        ${
          isClosed
            ? "border border-green-300 bg-green-50"
            : "border border-indigo-200 bg-white"
        }
      `}
    >
      {/* Header */}
      <div
        className={`flex justify-between items-center px-5 py-3
        ${
          isClosed
            ? "bg-green-200 text-gray-800"
            : "bg-gradient-to-r from-indigo-600 to-indigo-500 text-white"
        }
        `}
      >
        <div className="flex items-center gap-2">
          {item.type === "supplier" ? (
            <Truck className="w-5 h-5" />
          ) : (
            <Package className="w-5 h-5" />
          )}
          <h3 className="text-lg font-bold truncate">
            {item.type === "supplier"
              ? item.name || "Supplier"
              : item.name || "Modi"}
          </h3>
        </div>

        <div className="flex gap-2">
          {!isClosed ? (
            <>
              <button
                onClick={() => onDayClose(item.id)}
                className="px-3 py-1 rounded bg-green-500 text-white text-sm hover:bg-green-600 transition"
              >
                Day Close
              </button>
              <button
                onClick={() => onDelete(item.id)}
                className="p-1 rounded-full hover:bg-white/20 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </>
          ) : (
            <button
              onClick={() => onDayOpen(item.id)}
              className="px-3 py-1 rounded bg-yellow-500 text-white text-sm hover:bg-yellow-600 transition"
            >
              Reopen
            </button>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="p-5 space-y-4">
        <div>
          <span
            className={`px-3 py-1 text-xs uppercase tracking-wide rounded-full font-medium 
              ${
                item.type === "supplier"
                  ? "bg-blue-100 text-blue-700"
                  : "bg-purple-100 text-purple-700"
              }
            `}
          >
            {item.type || "N/A"}
          </span>
        </div>

        <div className="space-y-4 max-h-40 overflow-y-auto pr-2">
          {item.unloading_items?.map((it, idx) => {
            const available = it.available ?? it.quantity ?? 0;
            const total = it.total ?? it.quantity ?? 0;
            const percentage =
              total > 0 ? Math.round((available / total) * 100) : 0;

            return (
              <div
                key={idx}
                className="p-3 border rounded-lg bg-gray-50 shadow-sm"
              >
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-semibold text-gray-800">
                    {it.name || `Item ${idx + 1}`}
                  </h4>
                  <span className="text-sm text-gray-600">₹{it.rate || 0}</span>
                </div>

                <p className="text-sm text-gray-700 mb-2">
                  {available} / {total} {it.unit || ""}
                </p>

                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-2 rounded-full ${
                      percentage > 50 ? "bg-green-500" : "bg-red-500"
                    }`}
                    style={{ width: `${percentage}%` }}
                  ></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ItemCard;
