const Budget = require('../models/Budget');
const budgetUsage = require('../utils/budgetUsage');
const { asyncHandler, httpError, EXPENSE_CATEGORIES, ym } = require('../utils/helpers');

const validMonth = (m) => /^\d{4}-(0[1-9]|1[0-2])$/.test(m || '');

exports.list = asyncHandler(async (req, res) => {
  const month = req.query.month || ym(new Date());
  if (!validMonth(month)) throw httpError(400, 'Invalid month');
  res.json(await budgetUsage(req.user._id, month));
});

exports.create = asyncHandler(async (req, res) => {
  const { category, amount } = req.body;
  const month = req.body.month || ym(new Date());
  if (!validMonth(month)) throw httpError(400, 'Invalid month');
  if (category !== 'Overall' && !EXPENSE_CATEGORIES.includes(category)) throw httpError(400, 'Invalid category');
  if (!Number(amount) || Number(amount) <= 0) throw httpError(400, 'Budget amount must be greater than 0');
  const exists = await Budget.findOne({ user: req.user._id, category, month });
  if (exists) throw httpError(409, `A ${category} budget already exists for ${month}. Edit it instead.`);
  const b = await Budget.create({ user: req.user._id, category, amount: Number(amount), month });
  res.status(201).json(b);
});

exports.update = asyncHandler(async (req, res) => {
  const amount = Number(req.body.amount);
  if (!amount || amount <= 0) throw httpError(400, 'Budget amount must be greater than 0');
  const b = await Budget.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { amount }, { new: true });
  if (!b) throw httpError(404, 'Budget not found');
  res.json(b);
});

exports.remove = asyncHandler(async (req, res) => {
  const b = await Budget.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!b) throw httpError(404, 'Budget not found');
  res.json({ message: 'Deleted' });
});
