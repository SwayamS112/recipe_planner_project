// models/Post.js
const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: String,
  content: String,
  isRemoved: { type: Boolean, default: false }, // soft delete for moderation
  removedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // admin who removed
  flagged: { type: Boolean, default: false }, // flagged by users or auto
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Post", postSchema);
