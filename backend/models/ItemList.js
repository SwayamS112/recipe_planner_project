// backend/models/ItemList.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ItemSchema = new Schema({
  name: { type: String, required: true, trim: true },
  qty: { type: String, default: "" },
  unit: { type: String, default: "" },  // e.g. kg, gm, packet, etc
  obtained: { type: Boolean, default: false }
});

const ItemListSchema = new Schema({
  user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, default: 'Shopping List' },
  items: { type: [ItemSchema], default: [] },
  isDone: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('ItemList', ItemListSchema);
