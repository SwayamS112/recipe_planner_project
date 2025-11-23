// frontend/src/pages/AddRecipe.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";

export default function AddRecipe() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ingredients, setIngredients] = useState([]); // array of {name, qty, unit}
  const [steps, setSteps] = useState([]); // array of strings
  const [newIngredient, setNewIngredient] = useState({ name: "", qty: "", unit: "" });
  const [newStep, setNewStep] = useState("");
  const [images, setImages] = useState([]); // File[]
  const [video, setVideo] = useState(null);
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);

  function addIngredient() {
    if (!newIngredient.name.trim()) return;
    setIngredients(prev => [...prev, { ...newIngredient, name: newIngredient.name.trim() }]);
    setNewIngredient({ name: "", qty: "", unit: "" });
  }

  function removeIngredient(idx) {
    setIngredients(prev => prev.filter((_, i) => i !== idx));
  }

  function addStep() {
    if (!newStep.trim()) return;
    setSteps(prev => [...prev, newStep.trim()]);
    setNewStep("");
  }

  function removeStep(idx) {
    setSteps(prev => prev.filter((_, i) => i !== idx));
  }

  function handleImageFiles(e) {
    const files = e.target.files ? Array.from(e.target.files) : [];
    setImages(prev => [...prev, ...files]);
    e.target.value = "";
  }

  function removeImage(idx) {
    setImages(prev => prev.filter((_, i) => i !== idx));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("title", title);
      fd.append("description", description);
      fd.append("isPublic", isPublic ? "true" : "false");

      // stringified structured ingredients
      fd.append("ingredients", JSON.stringify(ingredients));
      fd.append("steps", JSON.stringify(steps));

      // images
      images.forEach((f) => fd.append("images", f));
      if (video) fd.append("video", video);

      const res = await api.post("/recipes", fd);
      alert("Recipe added");
      navigate(`/recipes/${res.data._id}`);
    } catch (err) {
      console.error("Add failed:", err);
      alert(err.response?.data?.message || "Failed to add recipe");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Add Recipe</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-semibold">Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border p-2 rounded" />
        </div>

        <div>
          <label className="block font-semibold">Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border p-2 rounded" rows={3} />
        </div>

        <div>
          <label className="block font-semibold">Ingredients</label>

          <div className="flex gap-2 mt-2">
            <input placeholder="Name (e.g. Flour)" value={newIngredient.name}
              onChange={e => setNewIngredient(prev => ({ ...prev, name: e.target.value }))}
              className="flex-1 border p-2 rounded" />
            <input placeholder="Qty (e.g. 2)" value={newIngredient.qty}
              onChange={e => setNewIngredient(prev => ({ ...prev, qty: e.target.value }))}
              className="w-24 border p-2 rounded" />
            <input placeholder="Unit (e.g. cups)" value={newIngredient.unit}
              onChange={e => setNewIngredient(prev => ({ ...prev, unit: e.target.value }))}
              className="w-28 border p-2 rounded" />
            <button type="button" onClick={addIngredient} className="px-3 py-1 bg-green-600 text-white rounded">Add</button>
          </div>

          <ul className="mt-2 space-y-1">
            {ingredients.map((ing, i) => (
              <li key={i} className="flex justify-between items-center">
                <div>{ing.qty ? `${ing.qty} ${ing.unit} ` : ""}{ing.name}</div>
                <button type="button" onClick={() => removeIngredient(i)} className="text-red-500">Remove</button>
              </li>
            ))}
            {ingredients.length === 0 && <li className="text-sm text-gray-500">No ingredients added</li>}
          </ul>
        </div>

        <div>
          <label className="block font-semibold">Steps</label>
          <div className="flex gap-2 mt-2">
            <input placeholder="Step description" value={newStep}
              onChange={e => setNewStep(e.target.value)} className="flex-1 border p-2 rounded" />
            <button type="button" onClick={addStep} className="px-3 py-1 bg-blue-600 text-white rounded">Add</button>
          </div>

          <ol className="mt-2 list-decimal list-inside">
            {steps.map((s, i) => (
              <li key={i} className="flex justify-between items-start">
                <div>{s}</div>
                <button type="button" onClick={() => removeStep(i)} className="text-red-500">Remove</button>
              </li>
            ))}
            {steps.length === 0 && <li className="text-sm text-gray-500">No steps added</li>}
          </ol>
        </div>

        <div>
          <label className="block font-semibold">Images</label>
          <input type="file" multiple accept="image/*" onChange={handleImageFiles} className="block mt-2" />
          <div className="flex gap-2 mt-2 flex-wrap">
            {images.map((f, i) => {
              const url = URL.createObjectURL(f);
              return (
                <div key={i} className="relative">
                  <img src={url} alt={f.name} className="w-32 h-24 object-cover rounded border" />
                  <button type="button" onClick={() => removeImage(i)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-6 h-6 text-xs">×</button>
                </div>
              );
            })}
            {images.length === 0 && <div className="text-sm text-gray-500">No images selected</div>}
          </div>
        </div>

        <div>
          <label className="block font-semibold">Video (optional)</label>
          <input type="file" accept="video/*" onChange={e => setVideo(e.target.files?.[0] || null)} />
          {video && <div className="mt-2 text-sm">{video.name}</div>}
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} />
            <span>Public</span>
          </label>

          <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded">
            {loading ? "Saving..." : "Save Recipe"}
          </button>
        </div>
      </form>
    </div>
  );
}
