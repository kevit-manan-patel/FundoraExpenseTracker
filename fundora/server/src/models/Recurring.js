const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: [true, 'Name is required'], trim: true, maxlength: 80 },
  amount: { type: Number, required: true, min: [0.01, 'Amount must be greater than 0'] },
  cycle: { type: String, enum: ['weekly', 'monthly', 'yearly'], default: 'monthly' },
  nextDate: { type: Date, required: true },
  category: { type: String, default: 'Subscriptions' },
  status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  lastPaidDate: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Recurring', schema);
