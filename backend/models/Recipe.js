// backend/models/Recipe.js
const mongoose = require("mongoose");

const IngredientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  qty: { type: String, default: "" },  // keep as string to allow "2", "1/2", "a pinch"
  unit: { type: String, default: "" }  // e.g. "kg", "g", "cup"
}, { _id: false });

const RecipeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    steps: { type: [String], default: [] },
    // structured ingredients
    ingredients: { type: [IngredientSchema], default: [] },
    images: { type: [String], default: [] },
    video: { type: String, default: "" },
    author: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
   likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User", default: [] }],

comments: [
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    text: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  }
],

    isPublic: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Recipe", RecipeSchema);
