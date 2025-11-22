// frontend/src/components/ItemListCard.jsx
import React from 'react';

export default function ItemListCard({ list, onToggleItem, onMarkDone }) {
  // support different shapes of list returned by backend
  const items = list.items || [];

  return (
    <div className={`border rounded-lg p-4 shadow-sm ${list.done ? 'bg-gray-50 opacity-80' : 'bg-white'}`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-semibold">{list.title || 'Untitled list'}</h3>
          <p className="text-sm text-gray-500">{new Date(list.createdAt || Date.now()).toLocaleString()}</p>
        </div>
        <div className="text-right">
          {list.done ? (
            <span className="text-sm px-2 py-1 rounded bg-green-100 text-green-700">Completed</span>
          ) : (
            <span className="text-sm px-2 py-1 rounded bg-yellow-100 text-yellow-800">{items.filter(i => i.obtained).length}/{items.length} got</span>
          )}
        </div>
      </div>

      <ul className="space-y-2 mb-4">
        {items.map(item => (
          <li key={item._id || item.name} className="flex items-center justify-between">
            <div>
              <div className={`font-medium ${item.obtained ? 'line-through text-gray-500' : ''}`}>{item.name}</div>
              <div className="text-sm text-gray-600">Qty: {item.qty || item.quantity || 1}</div>
            </div>

            <div>
              <button
                onClick={() => onToggleItem(list._id, item._id)}
                className={`text-sm px-3 py-1 rounded ${item.obtained ? 'bg-green-600 text-white' : 'bg-gray-200'}`}
              >
                {item.obtained ? 'Got it' : 'Not yet'}
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="flex justify-end">
        <button
          onClick={() => onMarkDone(list._id)}
          disabled={list.done}
          className={`px-4 py-1 rounded text-white ${list.done ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600'}`}
        >
          {list.done ? 'Done' : "I'm done"}
        </button>
      </div>
    </div>
  );
}
