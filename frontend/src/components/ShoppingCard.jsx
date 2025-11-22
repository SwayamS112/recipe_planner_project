// frontend/src/components/ShoppingCard.jsx
import React, { useState } from 'react';
import api from '../utils/api';
import { toast } from 'sonner';

const UNIT_OPTIONS = ['kg','gm','packet','piece','litre','dozen'];

export default function ShoppingCard({ list: initialList, onChanged }) {
  const [list, setList] = useState(initialList);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editValues, setEditValues] = useState({ name: '', qty: '', unit: 'kg' });

  // inputs to add a new item one-by-one
  const [newName, setNewName] = useState('');
  const [newQty, setNewQty] = useState('');
  const [newUnit, setNewUnit] = useState('kg');

  const [saving, setSaving] = useState(false);

  // add new item locally then save
  async function addItem() {
    if (!newName.trim()) return toast.error('Enter item name');
    const newItem = { name: newName.trim(), qty: String(newQty || '').trim(), unit: newUnit, obtained: false };
    const updatedItems = [...list.items, newItem];
    try {
      setSaving(true);
      // update on server by replacing items array
      await api.put(`/items/${list._id}`, { items: updatedItems });
      const r = await api.get(`/items/${list._id}`);
      setList(r.data);
      setNewName(''); setNewQty(''); setNewUnit('kg');
      onChanged?.();
    } catch (err) {
      console.error(err);
      toast.error('Add failed');
    } finally { setSaving(false); }
  }

  // toggle obtained
  async function toggleObtained(idx) {
    try {
      await api.patch(`/items/${list._id}/item/${idx}/toggle`);
      const r = await api.get(`/items/${list._id}`);
      setList(r.data);
      onChanged?.();
    } catch (err) {
      console.error(err);
      toast.error('Action failed');
    }
  }

  // start editing an item
  function startEdit(idx) {
    const it = list.items[idx];
    setEditingIndex(idx);
    setEditValues({ name: it.name, qty: it.qty, unit: it.unit || 'kg' });
  }

  // save edited item
  async function saveEdit(idx) {
    try {
      setSaving(true);
      await api.patch(`/items/${list._id}/item/${idx}`, { name: editValues.name, qty: editValues.qty, unit: editValues.unit });
      const r = await api.get(`/items/${list._id}`);
      setList(r.data);
      setEditingIndex(null);
      onChanged?.();
    } catch (err) {
      console.error(err);
      toast.error('Save failed');
    } finally { setSaving(false); }
  }

  // delete item
  async function deleteItem(idx) {
    if (!confirm('Delete this item?')) return;
    try {
      await api.delete(`/items/${list._id}/item/${idx}`);
      const r = await api.get(`/items/${list._id}`);
      setList(r.data);
      onChanged?.();
    } catch (err) {
      console.error(err);
      toast.error('Delete failed');
    }
  }

  // mark list done/undone
  async function markDone(done) {
    try {
      await api.patch(`/items/${list._id}/done`, { done });
      const r = await api.get(`/items/${list._id}`);
      setList(r.data);
      onChanged?.();
    } catch (err) {
      console.error(err);
      toast.error('Action failed');
    }
  }

  // delete list
  async function deleteList() {
    if (!confirm('Delete list?')) return;
    try {
      await api.delete(`/items/${list._id}`);
      toast.success('Deleted');
      onChanged?.();
    } catch (err) {
      console.error(err);
      toast.error('Delete failed');
    }
  }

  return (
    <div className={`p-4 bg-white rounded shadow ${list.isDone ? 'opacity-60' : ''}`}>
      <div className="flex justify-between items-center mb-3">
        <div>
          <div className="font-semibold text-lg">{list.title}</div>
          <div className="text-xs text-gray-500">{new Date(list.createdAt).toLocaleString()}</div>
        </div>

        <div className="flex gap-2">
          <button onClick={() => markDone(!list.isDone)} className="px-3 py-1 border rounded">
            {list.isDone ? 'Mark not done' : 'Mark done'}
          </button>
          <button onClick={deleteList} className="px-3 py-1 border rounded text-red-600">Delete</button>
        </div>
      </div>

      {/* Add item inline */}
      <div className="flex gap-2 items-center mb-4">
        <input className="border p-2 flex-1" placeholder="Item name" value={newName} onChange={e => setNewName(e.target.value)} />
        <input className="border p-2 w-20" placeholder="Qty" value={newQty} onChange={e => setNewQty(e.target.value)} />
        <select className="border p-2" value={newUnit} onChange={e => setNewUnit(e.target.value)}>
          {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
        <button onClick={addItem} disabled={saving} className="px-3 py-1 bg-amber-600 text-white rounded">Add</button>
      </div>

      {/* Ordered list with nice layout */}
      <ol className="list-decimal pl-6 space-y-3">
        {list.items.map((it, idx) => (
          <li key={idx} className="flex justify-between items-center">
            {editingIndex === idx ? (
              <div className="flex-1 flex gap-2 items-center">
                <input className="border p-1 flex-1" value={editValues.name} onChange={e => setEditValues(v => ({...v, name: e.target.value}))} />
                <input className="border p-1 w-20" value={editValues.qty} onChange={e => setEditValues(v => ({...v, qty: e.target.value}))} />
                <select className="border p-1" value={editValues.unit} onChange={e => setEditValues(v => ({...v, unit: e.target.value}))}>
                  {UNIT_OPTIONS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
                <button onClick={() => saveEdit(idx)} disabled={saving} className="px-2 py-1 border rounded">Save</button>
                <button onClick={() => setEditingIndex(null)} className="px-2 py-1 border rounded">Cancel</button>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center bg-gray-100 text-sm font-medium`}>
                    {it.name?.charAt(0)?.toUpperCase() || '-'}
                  </div>
                  <div>
                    <div className={`font-medium ${it.obtained ? 'line-through text-gray-500' : ''}`}>{it.name}</div>
                    <div className="text-xs text-gray-500">{it.qty || '-'} {it.unit || ''}</div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <label className="inline-flex items-center gap-2">
                    <input type="checkbox" checked={!!it.obtained} onChange={() => toggleObtained(idx)} disabled={list.isDone} />
                    <span className="text-sm">{it.obtained ? 'Bought' : 'Not bought'}</span>
                  </label>

                  <button onClick={() => startEdit(idx)} className="px-2 py-1 border rounded">Edit</button>
                  <button onClick={() => deleteItem(idx)} className="px-2 py-1 border rounded text-red-600">Delete</button>
                </div>
              </>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
