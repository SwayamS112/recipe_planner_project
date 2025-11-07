//backend/models/ItemList.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ItemSchema = new Schema({
  user: {type: Schema.Types.ObjectId, ref:'User'},
  items: [{name:String, quantity:String, bought:Boolean}],
}, {timestamps:true});

module.exports = mongoose.model('ItemList', ItemSchema);
