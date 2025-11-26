// models/Post.js
const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  title: String,
  content: String,
  isRemoved: { type: Boolean, default: false },
  removedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  flagged: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Post", postSchema);
