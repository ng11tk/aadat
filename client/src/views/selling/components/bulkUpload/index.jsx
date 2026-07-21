import { Plus } from "lucide-react";
import React from "react";

const BulkUpload = () => {
  
  return (
    <div className="p-6 bg-white min-h-screen text-gray-900">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold mb-4">Bulk Upload</h1>
        <button
          onClick={() => console.log("Upload CSV clicked")}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold shadow hover:bg-indigo-700 transition"
        >
          Upload CSV
        </button>
      </div>
    </div>
  );
};

export default BulkUpload;
