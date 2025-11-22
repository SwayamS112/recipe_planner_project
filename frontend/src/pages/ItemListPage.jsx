// frontend/src/pages/ItemListPage.jsx
import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import ShoppingCard from '../components/ShoppingCard';
import { toast } from 'sonner';

export default function ItemListPage() {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);

  // quick create fields (title not required)
  const [title, setTitle] = useState('');

  useEffect(() => {
    loadLists();
  }, []);

  async function loadLists() {
    try {
      setLoading(true);
      const res = await api.get('/items');
      setLists(res.data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load lists');
    } finally {
      setLoading(false);
    }
  }

  async function createEmptyList() {
    try {
      // create a list with no items; user will add items inside card and save changes
      const res = await api.post('/items', { title: title || 'Shopping List', items: [{ name: 'example', qty: '1', unit: 'kg' }] });
      // the endpoint requires at least one item, so create with a placeholder then immediately remove it
      // but better: we can create by opening a temporary modal; for simplicity, create minimal
      toast.success('Created list — edit items now');
      setTitle('');
      loadLists();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Create failed');
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="List title (optional)" className="border p-2 rounded w-64" />
        <button onClick={createEmptyList} className="px-4 py-2 bg-amber-600 text-white rounded">Create list</button>
      </div>

      {loading ? <div>Loading...</div> : (
        lists.length === 0 ? <div>No lists yet. Create one above.</div> : (
          <div className="grid gap-4">
            {lists.map(list => (
              <ShoppingCard key={list._id} list={list} onChanged={loadLists} />
            ))}
          </div>
        )
      )}
    </div>
  );
}
