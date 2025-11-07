// frontend/src/pages/dashboard/MyRecipesTab.jsx
import React, { useEffect, useState } from "react";
import api from "../../utils/api";
import { Link } from "react-router-dom";
import { toast } from "sonner";

export default function MyRecipesTab() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchMine = async () => {
    try {
      const res = await api.get("/recipes/mine");
      setRecipes(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load recipes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMine(); }, []);

  async function handleDelete(id) {
    if (!confirm("Delete this recipe?")) return;
    try {
      await api.delete(`/recipes/${id}`);
      setRecipes(prev => prev.filter(r => r._id !== id));
      toast.success("Deleted");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Delete failed");
    }
  }

  if (loading) return <div>Loading recipes...</div>;

  return (
    <div className="space-y-4">
      {recipes.length === 0 && <div>No recipes yet. <Link to="/add" className="text-orange-600">Add one</Link></div>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recipes.map(r => (
          <div key={r._id} className="bg-white rounded-lg shadow p-4">
            <div className="flex gap-4">
              <div className="w-24 h-24 bg-gray-100 rounded overflow-hidden">
                {r.image ? <img src={r.image} className="w-full h-full object-cover" /> : <div className="p-4 text-sm">No image</div>}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">{r.title}</h4>
                <p className="text-sm text-gray-600 truncate">{r.description}</p>
                <div className="mt-2 flex gap-2">
                  <Link to={`/recipes/${r._id}/edit`} className="text-sm px-2 py-1 bg-orange-50 rounded text-orange-600">Edit</Link>
                  <button onClick={() => handleDelete(r._id)} className="text-sm px-2 py-1 rounded border">Delete</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
