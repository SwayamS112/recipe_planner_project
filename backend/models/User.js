// backend/models/User.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  name: String,
  email: { type: String, unique: true, required: true },
  passwordHash: String,
  salt: String,
  avatar: String,
  phone: { type: Number, default: null } 
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
