// frontend/src/pages/AddRecipe.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";

export default function AddRecipe() {
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ingredients, setIngredients] = useState([]);
  const [steps, setSteps] = useState([]);
  const [newIngredient, setNewIngredient] = useState({ name: "", qty: "", unit: "" });
  const [newStep, setNewStep] = useState("");
  const [images, setImages] = useState([]);
  const [video, setVideo] = useState(null);
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);

  const addIngredient = () => {
    if (!newIngredient.name.trim()) return;
    setIngredients([...ingredients, newIngredient]);
    setNewIngredient({ name: "", qty: "", unit: "" });
  };

  const removeIngredient = (i) => {
    setIngredients(ingredients.filter((_, idx) => idx !== i));
  };

  const addStep = () => {
    if (!newStep.trim()) return;
    setSteps([...steps, newStep.trim()]);
    setNewStep("");
  };

  const removeStep = (i) => {
    setSteps(steps.filter((_, idx) => idx !== i));
  };

  const handleImages = (e) => {
    const files = Array.from(e.target.files || []);
    setImages([...images, ...files]);
  };

  const removeImage = (i) => {
    setImages(images.filter((_, idx) => idx !== i));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const fd = new FormData();
      fd.append("title", title);
      fd.append("description", description);
      fd.append("isPublic", isPublic ? "true" : "false");

      fd.append("ingredients", JSON.stringify(ingredients));
      fd.append("steps", JSON.stringify(steps));

      images.forEach((img) => fd.append("images", img));
      if (video) fd.append("video", video);

      const res = await api.post("/recipes", fd);
      alert("Recipe added!");
      navigate(`/recipes/${res.data._id}`);
    } catch (err) {
      alert(err.response?.data?.message || "Error adding recipe");
    }

    setLoading(false);
  };

  return (
<div className="min-h-screen bg-linear-to-br from-orange-50 via-amber-50 to-rose-50">
  <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-semibold text-amber-700 mb-6">
        Add a New Recipe
      </h1>

      <form onSubmit={handleSubmit} className="space-y-8 bg-white rounded-xl p-6 shadow-lg">

        {/* Title */}
        <div>
          <label className="block text-sm font-semibold mb-1">Recipe Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-amber-300"
            placeholder="e.g. Chocolate Cake"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-semibold mb-1">Description</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-amber-300"
            placeholder="Short description of your recipe..."
          />
        </div>

        {/* Ingredients */}
        <div>
          <h2 className="text-xl font-semibold text-amber-700 mb-2">Ingredients</h2>

          {/* Input row */}
          <div className="grid grid-cols-4 gap-3">
            <input
              placeholder="Name"
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-300"
              value={newIngredient.name}
              onChange={(e) => setNewIngredient({ ...newIngredient, name: e.target.value })}
            />
            <input
              placeholder="Qty"
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-300"
              value={newIngredient.qty}
              onChange={(e) => setNewIngredient({ ...newIngredient, qty: e.target.value })}
            />
            <input
              placeholder="Unit"
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-amber-300"
              value={newIngredient.unit}
              onChange={(e) => setNewIngredient({ ...newIngredient, unit: e.target.value })}
            />
            <button
              type="button"
              onClick={addIngredient}
              className="bg-amber-600 hover:bg-amber-700 text-white rounded-lg px-3 py-2"
            >
              Add
            </button>
          </div>

          {/* Ingredient List */}
          <div className="mt-3 space-y-2">
            {ingredients.length === 0 && (
              <p className="text-sm text-gray-500">No ingredients added yet.</p>
            )}

            {ingredients.map((ing, i) => (
              <div
                key={i}
                className="flex justify-between bg-amber-50 px-4 py-2 rounded-lg"
              >
                <span className="text-gray-700">
                  {ing.qty && `${ing.qty} ${ing.unit} - `}{ing.name}
                </span>
                <button
                  type="button"
                  onClick={() => removeIngredient(i)}
                  className="text-red-500 text-sm"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Steps */}
        <div>
          <h2 className="text-xl font-semibold text-amber-700 mb-2">Steps</h2>

          <div className="flex gap-3">
            <input
              value={newStep}
              placeholder="Describe the step..."
              onChange={(e) => setNewStep(e.target.value)}
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-amber-300"
            />
            <button
              type="button"
              onClick={addStep}
              className="bg-amber-600 hover:bg-amber-700 text-white rounded-lg px-4 py-2"
            >
              Add
            </button>
          </div>

          <ol className="mt-3 space-y-2 list-decimal list-inside">
            {steps.map((s, i) => (
              <li key={i} className="bg-amber-50 px-4 py-2 rounded-lg flex justify-between">
                <span>{s}</span>
                <button
                  type="button"
                  onClick={() => removeStep(i)}
                  className="text-red-500 text-sm"
                >
                  Remove
                </button>
              </li>
            ))}
            {steps.length === 0 && (
              <p className="text-sm text-gray-500">No steps added yet.</p>
            )}
          </ol>
        </div>

        {/* Images */}
        <div>
          <h2 className="text-xl font-semibold text-amber-700 mb-2">Images</h2>

          <input type="file" accept="image/*" multiple onChange={handleImages} />

          <div className="flex flex-wrap gap-3 mt-3">
            {images.map((file, i) => {
              const src = URL.createObjectURL(file);
              return (
                <div key={i} className="relative">
                  <img src={src} className="w-32 h-24 rounded-lg object-cover shadow" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-6 h-6"
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Video */}
        <div>
          <h2 className="text-xl font-semibold text-amber-700 mb-2">Video (Optional)</h2>
          <input type="file" accept="video/*" onChange={(e) => setVideo(e.target.files?.[0])} />
          {video && <p className="text-sm text-gray-600 mt-1">{video.name}</p>}
        </div>

        {/* Public + Submit */}
        <div className="flex items-center gap-3 pt-4 border-t">
          <label className="flex items-center gap-2 text-gray-700">
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
            />
            Public
          </label>

          <button
            disabled={loading}
            className="ml-auto bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-lg shadow"
          >
            {loading ? "Saving..." : "Save Recipe"}
          </button>
        </div>
      </form>
      </div>
    </div>
  );
}
