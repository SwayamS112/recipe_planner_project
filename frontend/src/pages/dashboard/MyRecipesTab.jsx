// src/pages/dashboard/MyRecipesTab.jsx
import React from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

export default function MyRecipesTab({ recipes = [], onDelete = () => {} }) {
  if (!recipes || recipes.length === 0) {
    return (
      <div className="text-center py-20">
        <h3 className="text-lg font-semibold text-slate-800">No recipes yet</h3>
        <p className="text-sm text-slate-500 mt-2">Start by adding your signature dish.</p>
        <Link to="/add" className="inline-block mt-4 py-2 px-4 bg-food-500 text-white rounded-lg">Add your first recipe</Link>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">My Recipes</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recipes.map((r) => (
          <article key={r._id} className="rounded-lg overflow-hidden shadow-sm border">
            <div className="flex gap-4 p-4 items-start">
              <div className="w-28 h-20 bg-gray-100 rounded overflow-hidden shrink-0">
                {r.images?.[0] ? (
                  <img src={r.images[0]} alt={r.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-sm text-slate-400">No image</div>
                )}
              </div>

              <div className="flex-1">
                <h3 className="font-semibold text-slate-800">{r.title}</h3>
                <p className="text-sm text-slate-500 mt-1 line-clamp-2">{r.description}</p>

                <div className="mt-3 flex gap-2">
                  <Link to={`/recipes/${r._id}/edit`} className="px-3 py-1 border rounded text-sm">Edit</Link>
                  <button
                    onClick={() => {
                      if (!confirm("Delete this recipe?")) return;
                      onDelete(r._id);
                    }}
                    className="px-3 py-1 border rounded text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
