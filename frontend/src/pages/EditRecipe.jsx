// frontend/src/pages/EditRecipe.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../utils/api";

export default function EditRecipe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ingredients, setIngredients] = useState([]); // array of {name, qty, unit}
  const [steps, setSteps] = useState([]); // array of strings
  const [existingImages, setExistingImages] = useState([]);
  const [newImageFiles, setNewImageFiles] = useState([]);
  const [videoFile, setVideoFile] = useState(null);
  const [isPublic, setIsPublic] = useState(true);

  // helpers for new inputs
  const [newIngredient, setNewIngredient] = useState({ name: "", qty: "", unit: "" });
  const [newStep, setNewStep] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await api.get(`/recipes/${id}`);
        const r = res.data;
        setTitle(r.title || "");
        setDescription(r.description || "");
        setIngredients(Array.isArray(r.ingredients) ? r.ingredients : (r.ingredients ? r.ingredients.map(n => ({ name: n })) : []));
        setSteps(Array.isArray(r.steps) ? r.steps : []);
        setExistingImages((r.images && r.images.length) ? r.images : (r.image ? [r.image] : []));
        setIsPublic(typeof r.isPublic !== "undefined" ? r.isPublic : true);
      } catch (err) {
        console.error("Failed to load recipe:", err);
        alert("Failed to load recipe. Check console.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  function addIngredient() {
    if (!newIngredient.name.trim()) return;
    setIngredients(prev => [...prev, { ...newIngredient, name: newIngredient.name.trim() }]);
    setNewIngredient({ name: "", qty: "", unit: "" });
  }

  function removeIngredient(index) {
    setIngredients(prev => prev.filter((_, i) => i !== index));
  }

  function addStep() {
    if (!newStep.trim()) return;
    setSteps(prev => [...prev, newStep.trim()]);
    setNewStep("");
  }

  function removeStep(index) {
    setSteps(prev => prev.filter((_, i) => i !== index));
  }

  function handleNewImages(e) {
    const files = e.target.files ? Array.from(e.target.files) : [];
    setNewImageFiles(prev => [...prev, ...files]);
    e.target.value = "";
  }

  function removeNewImageFile(idx) {
    setNewImageFiles(prev => prev.filter((_, i) => i !== idx));
  }

  function removeExistingImage(url) {
    setExistingImages(prev => prev.filter(u => u !== url));
  }

  async function handleSave(e) {
    e.preventDefault();
    try {
      const fd = new FormData();
      fd.append("title", title || "");
      fd.append("description", description || "");
      fd.append("ingredients", JSON.stringify(ingredients || []));
      fd.append("steps", JSON.stringify(steps || []));
      fd.append("isPublic", isPublic ? "true" : "false");

      const shouldReplaceImages = newImageFiles.length > 0 || existingImages.length === 0;
      if (shouldReplaceImages) {
        fd.append("replaceImages", "true");
        fd.append("keepImages", JSON.stringify(existingImages || []));
      }

      for (const f of newImageFiles) {
        fd.append("images", f);
      }

      if (videoFile) {
        fd.append("video", videoFile);
      }

      const res = await api.put(`/recipes/${id}`, fd);
      alert("Saved");
      navigate(`/recipes/${res.data._id}`);
    } catch (err) {
      console.error("Save failed:", err);
      alert(err.response?.data?.message || "Failed to save recipe. See console.");
    }
  }

  if (loading) return <div className="p-4">Loading...</div>;

  return (
    <div className="p-4 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold mb-4">Edit Recipe</h2>
      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="block font-semibold">Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)} className="w-full border p-2 rounded" />
        </div>

        <div>
          <label className="block font-semibold">Description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full border p-2 rounded" rows={4} />
        </div>

        <div>
          <label className="block font-semibold">Ingredients</label>

          <div className="flex gap-2 mt-2">
            <input placeholder="Name (e.g. Flour)" value={newIngredient.name}
              onChange={e => setNewIngredient(prev => ({ ...prev, name: e.target.value }))} className="flex-1 border p-2 rounded" />
            <input placeholder="Qty (e.g. 2)" value={newIngredient.qty}
              onChange={e => setNewIngredient(prev => ({ ...prev, qty: e.target.value }))} className="w-24 border p-2 rounded" />
            <input placeholder="Unit (e.g. cups)" value={newIngredient.unit}
              onChange={e => setNewIngredient(prev => ({ ...prev, unit: e.target.value }))} className="w-28 border p-2 rounded" />
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
            <input value={newStep} onChange={e => setNewStep(e.target.value)} placeholder="Step description" className="flex-1 border p-2 rounded" />
            <button type="button" onClick={addStep} className="px-3 py-1 bg-blue-600 text-white rounded">Add</button>
          </div>
          <ol className="mt-2 list-decimal list-inside">
            {steps.map((s, i) => (
              <li key={i} className="flex justify-between items-center">
                <div>{s}</div>
                <button type="button" onClick={() => removeStep(i)} className="text-red-500">Remove</button>
              </li>
            ))}
            {steps.length === 0 && <li className="text-sm text-gray-500">No steps added</li>}
          </ol>
        </div>

        <div>
          <label className="block font-semibold mb-2">Existing Images</label>
          <div className="flex gap-2 flex-wrap">
            {existingImages.map((url, idx) => (
              <div key={idx} className="relative">
                <img src={url} alt={`existing-${idx}`} className="w-32 h-24 object-cover rounded border" />
                <button type="button" onClick={() => removeExistingImage(url)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-6 h-6 text-xs">×</button>
              </div>
            ))}
            {existingImages.length === 0 && <div className="text-sm text-gray-500">No existing images</div>}
          </div>
        </div>

        <div>
          <label className="block font-semibold">Add New Images (you can add multiple)</label>
          <input type="file" multiple accept="image/*" onChange={handleNewImages} className="block mt-2" />
          <div className="flex gap-2 mt-2 flex-wrap">
            {newImageFiles.map((f, i) => {
              const url = URL.createObjectURL(f);
              return (
                <div key={i} className="relative">
                  <img src={url} alt={f.name} className="w-32 h-24 object-cover rounded border" />
                  <button type="button" onClick={() => removeNewImageFile(i)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-6 h-6 text-xs">×</button>
                </div>
              );
            })}
            {newImageFiles.length === 0 && <div className="text-sm text-gray-500">No new images selected</div>}
          </div>
        </div>

        <div>
          <label className="block font-semibold">Video (optional)</label>
          <input type="file" accept="video/*" onChange={e => setVideoFile(e.target.files?.[0] || null)} />
          {videoFile && <div className="mt-2 text-sm">{videoFile.name}</div>}
        </div>

        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} />
            <span>Public</span>
          </label>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
        </div>
      </form>
    </div>
  );
}
