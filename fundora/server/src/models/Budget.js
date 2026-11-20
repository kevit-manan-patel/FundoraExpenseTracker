const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  category: { type: String, required: true }, // an expense category or "Overall"
  amount: { type: Number, required: true, min: [1, 'Budget must be at least 1'] },
  month: { type: String, required: true, match: /^\d{4}-\d{2}$/ }, // YYYY-MM
}, { timestamps: true });

schema.index({ user: 1, category: 1, month: 1 }, { unique: true });
module.exports = mongoose.model('Budget', schema);
