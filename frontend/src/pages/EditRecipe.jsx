// frontend/src/pages/EditRecipe.jsx
import React, { useEffect, useState } from "react";
import api from "../utils/api";
import { useNavigate, useParams } from "react-router-dom";

export default function EditRecipe() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ingredients, setIngredients] = useState([{ name: "", quantity: "" }]);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [isPublic, setIsPublic] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/recipes/${id}`);
        const r = res.data;
        setTitle(r.title || "");
        setDescription(r.description || "");
        setIngredients((r.ingredients && r.ingredients.length) ? r.ingredients : [{ name: "", quantity: "" }]);
        setImagePreview(r.image || null);
        setIsPublic(!!r.isPublic);
      } catch (err) {
        console.error(err);
        alert("Failed to load recipe");
        navigate("/dashboard");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id, navigate]);

  function setIng(i, key, value) {
    const copy = [...ingredients];
    copy[i][key] = value;
    setIngredients(copy);
  }
  function addIngredient() {
    setIngredients(prev => [...prev, { name: "", quantity: "" }]);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("title", title);
      fd.append("description", description);
      fd.append("ingredients", JSON.stringify(ingredients));
      if (imageFile) fd.append("image", imageFile);
      if (videoFile) fd.append("video", videoFile);
      fd.append("isPublic", isPublic);

      await api.put(`/recipes/${id}`, fd, { headers: { "Content-Type": "multipart/form-data" } });
      alert("Updated");
      navigate("/dashboard/recipes");
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h2 className="text-xl font-semibold mb-4">Edit Recipe</h2>
      <form onSubmit={handleSave} className="space-y-4 bg-white p-4 rounded shadow">
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="input"
          placeholder="Title"
          required
        />

        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          className="input h-28"
          placeholder="Short description"
        />

        <div>
          <h4 className="font-medium">Ingredients</h4>
          <div className="space-y-2">
            {ingredients.map((ing, i) => (
              <div className="flex gap-2" key={i}>
                <input
                  value={ing.name}
                  onChange={e => setIng(i, "name", e.target.value)}
                  className="input flex-1"
                  placeholder="Name"
                />
                <input
                  value={ing.quantity}
                  onChange={e => setIng(i, "quantity", e.target.value)}
                  className="input w-28"
                  placeholder="Qty"
                />
              </div>
            ))}
            <button type="button" onClick={addIngredient} className="text-sm text-orange-600">+ Add</button>
          </div>
        </div>

        <div>
          <label className="block">Image</label>
          <input type="file" accept="image/*" onChange={e => {
            const f = e.target.files[0];
            setImageFile(f);
            if (f) setImagePreview(URL.createObjectURL(f));
          }} />
          {imagePreview && <img src={imagePreview} className="w-36 h-36 object-cover rounded mt-2" alt="preview" />}
        </div>

        <div>
          <label>Video (optional)</label>
          <input type="file" accept="video/*" onChange={e => setVideoFile(e.target.files[0])} />
        </div>

        <label className="inline-flex items-center">
          <input type="checkbox" checked={isPublic} onChange={e => setIsPublic(e.target.checked)} />
          <span className="ml-2">Public</span>
        </label>

        <div>
          <button type="submit" disabled={saving} className="btn bg-orange-500 text-white">
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
