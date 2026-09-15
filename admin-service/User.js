// admin-service/User.js
// Same schema as registration-service, reads/writes the same "users" collection.
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  phone: { type: String }
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);