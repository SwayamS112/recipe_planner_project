import React, { useState } from "react";
import api from "../utils/api";
import { useNavigate } from "react-router-dom";

export default function AddRecipe() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [ingredients, setIngredients] = useState([{ name: "", quantity: "" }]);
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [video, setVideo] = useState(null);
  const [isPublic, setIsPublic] = useState(false);
  const navigate = useNavigate();

  function addIngredient() {
    setIngredients((prev) => [...prev, { name: "", quantity: "" }]);
  }

  function setIng(i, key, value) {
    const copy = [...ingredients];
    copy[i][key] = value;
    setIngredients(copy);
  }

  async function handleSubmit(e) {
    e.preventDefault();

     const fd = new FormData();
  fd.append("title", title);
  fd.append("description", description);
  fd.append("ingredients", JSON.stringify(ingredientsArray));
  fd.append("steps", JSON.stringify(stepsArray));
  fd.append("isPublic", isPublic);

    // images (multiple)
  for (const file of imageFiles) {
    fd.append("images", file); 
  }

   // optional: video
  if (videoFile) {
    fd.append("video", videoFile);
  }

    try {
      await api.post("/recipes", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      navigate("/dashboard");
    } catch (e) {
      alert(e.response?.data?.error || e.message);
    }
  }

  return (
    <div className="max-w-2xl mx-auto mt-8 bg-white shadow-lg rounded-xl p-6">
      <h2 className="text-2xl font-semibold mb-4 text-gray-800">Add New Recipe</h2>

      <form onSubmit={handleSubmit} className="space-y-4">

        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Recipe title"
          className="w-full border rounded-lg px-3 py-2 focus:outline-none focus:ring focus:ring-orange-200"
        />

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Short description..."
          className="w-full border rounded-lg px-3 py-2 h-24 focus:outline-none focus:ring focus:ring-orange-200"
        />

        <div>
          <h4 className="font-medium mb-2">Ingredients</h4>
          <div className="space-y-2">
            {ingredients.map((ing, i) => (
              <div key={i} className="flex gap-2">
                <input
                  value={ing.name}
                  onChange={(e) => setIng(i, "name", e.target.value)}
                  placeholder="Name"
                  className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring focus:ring-orange-200"
                />
                <input
                  value={ing.quantity}
                  onChange={(e) => setIng(i, "quantity", e.target.value)}
                  placeholder="Qty"
                  className="w-28 border rounded-lg px-3 py-2 focus:outline-none focus:ring focus:ring-orange-200"
                />
              </div>
            ))}
            <button
              type="button"
              onClick={addIngredient}
              className="text-sm text-orange-600 hover:underline"
            >
              + Add another ingredient
            </button>
          </div>
        </div>

        <div>
          <label className="block mb-1">Recipe Image</label>
          <input
            required
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files[0];
              setImage(file);
              if (file) {
                setImagePreview(URL.createObjectURL(file));
              }
            }}
          />
          {imagePreview && (
            <img
              src={imagePreview}
              alt="preview"
              className="mt-2 w-32 h-32 object-cover rounded-lg"
            />
          )}
        </div>

        <div>
          <label className="block mb-1">Recipe Video (optional)</label>
          <input
            type="file"
            accept="video/*"
            onChange={(e) => setVideo(e.target.files[0])}
          />
        </div>

        <label className="inline-flex items-center">
          <input
            type="checkbox"
            checked={isPublic}
            onChange={(e) => setIsPublic(e.target.checked)}
          />
          <span className="ml-2">Make this recipe public</span>
        </label>

        <button className="w-full bg-orange-500 text-white py-2 rounded-lg hover:bg-orange-600 transition">
          Save Recipe
        </button>
      </form>
    </div>
  );
}
