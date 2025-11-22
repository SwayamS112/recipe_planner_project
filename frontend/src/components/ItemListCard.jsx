import React, { useState } from "react";

export default function ItemListCard() {
  const [itemName, setItemName] = useState("");
  const [qty, setQty] = useState("");
  const [unit, setUnit] = useState("kg");

  const [items, setItems] = useState([]);

  function addItem() {
    if (!itemName.trim()) return alert("Enter item name");

    const newItem = {
      name: itemName,
      qty,
      unit,
      obtained: false,
    };

    setItems([...items, newItem]);

    // clear inputs
    setItemName("");
    setQty("");
    setUnit("kg");
  }

  function toggleItem(index) {
    const updated = [...items];
    updated[index].obtained = !updated[index].obtained;
    setItems(updated);
  }

  return (
    <div className="p-4 bg-white shadow rounded w-full max-w-xl">

      <h2 className="text-xl font-bold mb-4">Shopping List</h2>

      {/* Add Item Section */}
      <div className="flex gap-2 mb-4">

        <input
          type="text"
          placeholder="Item name"
          className="border p-2 w-full"
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
        />

        <input
          type="number"
          placeholder="Qty"
          className="border p-2 w-20"
          value={qty}
          onChange={(e) => setQty(e.target.value)}
        />

        <select
          className="border p-2"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
        >
          <option value="kg">kg</option>
          <option value="gm">gm</option>
          <option value="packet">packet</option>
          <option value="piece">piece</option>
          <option value="litre">litre</option>
        </select>

        <button
          onClick={addItem}
          className="bg-amber-600 text-white px-3 rounded"
        >
          Add
        </button>
      </div>

      {/* Items List (Ordered) */}
      <ol className="list-decimal pl-5 space-y-2">
        {items.map((item, index) => (
          <li key={index} className="flex justify-between items-center">

            <div>
              <span className={`${item.obtained ? "line-through text-gray-500" : ""}`}>
                {item.name} — {item.qty} {item.unit}
              </span>
            </div>

            <input
              type="checkbox"
              checked={item.obtained}
              onChange={() => toggleItem(index)}
            />
          </li>
        ))}
      </ol>

    </div>
  );
}
