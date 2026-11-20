const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: [true, 'Title is required'], trim: true, maxlength: 120 },
  amount: { type: Number, required: true, min: [0.01, 'Amount must be greater than 0'] },
  type: { type: String, enum: ['income', 'expense'], required: true },
  category: { type: String, required: true },
  description: { type: String, default: '', maxlength: 500 },
  date: { type: Date, required: true, default: Date.now },
  paymentMethod: { type: String, enum: ['Cash', 'UPI', 'Card', 'Bank Transfer', 'Other'], default: 'UPI' },
  notes: { type: String, default: '', maxlength: 1000 },
  tags: [{ type: String, trim: true }],
}, { timestamps: true });

schema.index({ user: 1, date: -1 });
module.exports = mongoose.model('Transaction', schema);
