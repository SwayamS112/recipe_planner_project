// backend/models/ItemList.js
const mongoose = require('mongoose');

const ItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  qty: { type: Number, required: true, default: 1 },
  obtained: { type: Boolean, default: false } // toggled when user gets it
});

const ItemListSchema = new mongoose.Schema({
  title: { type: String, required: true },           // name of the shopping list
  items: { type: [ItemSchema], default: [] },        // array of items
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  done: { type: Boolean, default: false },          // true when whole list is finished
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ItemList', ItemListSchema);
