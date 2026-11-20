const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: [true, 'Goal name is required'], trim: true, maxlength: 80 },
  targetAmount: { type: Number, required: true, min: [1, 'Target must be at least 1'] },
  currentAmount: { type: Number, default: 0, min: 0 },
  targetDate: { type: Date },
  description: { type: String, default: '', maxlength: 400 },
  contributions: [{ amount: Number, date: { type: Date, default: Date.now } }],
}, { timestamps: true });

module.exports = mongoose.model('Goal', schema);
