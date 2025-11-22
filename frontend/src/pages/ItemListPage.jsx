// frontend/src/pages/ItemListPage.jsx

import React, { useEffect, useState } from "react";
import api from "../utils/api"; // your axios instance

export default function ItemListPage() {
  const [items, setItems] = useState([]);
  const [newItem, setNewItem] = useState({ name: "", quantity: "" });

  // Fetch the list on load
  useEffect(() => {
    loadItems();
  }, []);

  const loadItems = async () => {
    try {
      const res = await api.get("/items");
      setItems(res.data.items || []);
    } catch (err) {
      console.error(err);
    }
  };

  // Add new item to list (local state only)
  const addItem = () => {
    if (!newItem.name.trim()) return;

    setItems([
      ...items,
      {
        name: newItem.name,
        quantity: newItem.quantity || "1",
        bought: false,
      },
    ]);

    setNewItem({ name: "", quantity: "" });
  };

  // Toggle "bought" status
  const toggleBought = (index) => {
    const updated = [...items];
    updated[index].bought = !updated[index].bought;
    setItems(updated);
  };

  // Save to MongoDB
  const saveItems = async () => {
    try {
      await api.post("/items", { items });
      alert("Items Saved Successfully!");
    } catch (err) {
      console.error(err);
      alert("Error saving items");
    }
  };

  // Mark entire list as done
  const markListDone = async () => {
    const cleared = items.map((it) => ({ ...it, bought: true }));
    setItems(cleared);
    await api.post("/items", { items: cleared });
    alert("Shopping List Completed!");
  };

  return (
    <div className="mt-4">
      <h1 className="text-2xl font-bold mb-4">Shopping List</h1>

      {/* Add Item Section */}
      <div className="bg-white p-4 shadow rounded-lg mb-4 flex gap-2">
        <input
          type="text"
          placeholder="Item name..."
          className="border p-2 rounded w-full"
          value={newItem.name}
          onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
        />
        <input
          type="number"
          placeholder="Qty"
          className="border p-2 rounded w-20"
          value={newItem.quantity}
          onChange={(e) =>
            setNewItem({ ...newItem, quantity: e.target.value })
          }
        />
        <button
          onClick={addItem}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded"
        >
          Add
        </button>
      </div>

      {/* Item Cards */}
      <div className="grid gap-3">
        {items.length === 0 && (
          <p className="text-gray-500 text-center">No items added yet.</p>
        )}

        {items.map((item, index) => (
          <div
            key={index}
            className={`p-4 rounded-lg shadow bg-white flex justify-between items-center border-l-4 ${
              item.bought ? "border-green-500 bg-green-50" : "border-gray-300"
            }`}
          >
            {/* Item Info */}
            <div>
              <h3 className="font-semibold text-lg capitalize">
                {item.name}
              </h3>
              <p className="text-gray-600">Qty: {item.quantity}</p>
            </div>

            {/* Toggle button */}
            <button
              onClick={() => toggleBought(index)}
              className={`px-3 py-1 rounded text-white ${
                item.bought ? "bg-gray-500" : "bg-blue-500"
              }`}
            >
              {item.bought ? "Not Bought" : "Bought"}
            </button>
          </div>
        ))}
      </div>

      {/* Bottom Buttons */}
      <div className="flex mt-5 gap-3">
        <button
          onClick={saveItems}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded w-full"
        >
          Save Items
        </button>

        <button
          onClick={markListDone}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded w-full"
        >
          Mark List Done
        </button>
      </div>
    </div>
  );
}
