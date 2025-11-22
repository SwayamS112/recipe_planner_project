// backend/models/Recipe.js
const mongoose = require("mongoose");

const RecipeSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: { type: String, required: true },
  description: { type: String, default: "" },
  // legacy single image (kept for compatibility)
  image: { type: String, default: "" },
  // new: multiple images array
  images: { type: [String], default: [] },
  // optional video (single)
  video: { type: String, default: "" },
  ingredients: { type: [String], default: [] },
  steps: { type: [String], default: [] },
  isPublic: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model("Recipe", RecipeSchema);
