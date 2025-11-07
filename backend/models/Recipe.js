//backend/models/Recipe.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RecipeSchema = new Schema({
  user: {type: Schema.Types.ObjectId, ref:'User'},
  title: String,
  description: String,
  ingredients: [{name:String, quantity:String}],
  image: String,
  video: String,
  isPublic: {type:Boolean, default:false}
}, {timestamps:true});

module.exports = mongoose.model('Recipe', RecipeSchema);
