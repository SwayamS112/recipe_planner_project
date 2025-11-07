import React, { useEffect, useState } from 'react';
import api from '../utils/api';

export default function ItemListPage() {
  const [items, setItems] = useState([{ name:'', quantity:'', bought:false }]);

  useEffect(() => { fetchList(); }, []);

  async function fetchList() {
    try {
      const res = await api.get('/items');
      if (res.data && res.data.items) setItems(res.data.items);
    } catch (err) {
      console.error('Error fetching items:', err);
    }
  }

  function addRow() { setItems(prev => [...prev, { name:'', quantity:'', bought:false }]); }
  function setRow(i, key, val) { const c=[...items]; c[i][key]=val; setItems(c); }

  async function save() {
    try {
      await api.post('/items', { items });
      alert('Saved');
    } catch (err) {
      console.error('Error saving items:', err);
    }
  }

  return (
    <div className="max-w-2xl mx-auto bg-white p-4 shadow">
      <h2 className="text-xl font-bold">Item List (for shopping)</h2>
      <div className="space-y-2">
        {items.map((it, i) => (
          <div key={i} className="flex gap-2 items-center">
            <input value={it.name} onChange={e => setRow(i, 'name', e.target.value)} placeholder="Item name" className="input flex-1" />
            <input value={it.quantity} onChange={e => setRow(i, 'quantity', e.target.value)} placeholder="Quantity" className="input w-28" />
            <label className="inline-flex items-center">
              <input type="checkbox" checked={it.bought || false} onChange={e => setRow(i, 'bought', e.target.checked)} />
            </label>
          </div>
        ))}
      </div>
      <div className="mt-2">
        <button onClick={addRow} className="btn mr-2">Add item</button>
        <button onClick={save} className="btn">Save list</button>
      </div>
    </div>
  );
}
