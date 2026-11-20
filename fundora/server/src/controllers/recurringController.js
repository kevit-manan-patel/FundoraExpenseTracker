const Recurring = require('../models/Recurring');
const Transaction = require('../models/Transaction');
const { asyncHandler, httpError, EXPENSE_CATEGORIES, addCycle } = require('../utils/helpers');

const pick = (b) => {
  if (b.category && !EXPENSE_CATEGORIES.includes(b.category)) throw httpError(400, 'Invalid category');
  const nextDate = new Date(b.nextDate);
  if (isNaN(nextDate)) throw httpError(400, 'Next payment date is required');
  return { name: b.name, amount: Number(b.amount), cycle: b.cycle || 'monthly', nextDate, category: b.category || 'Subscriptions', status: b.status || 'active' };
};

exports.list = asyncHandler(async (req, res) => {
  res.json(await Recurring.find({ user: req.user._id }).sort({ nextDate: 1 }).lean());
});

exports.create = asyncHandler(async (req, res) => {
  res.status(201).json(await Recurring.create({ ...pick(req.body), user: req.user._id }));
});

exports.update = asyncHandler(async (req, res) => {
  const r = await Recurring.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, pick(req.body), { new: true, runValidators: true });
  if (!r) throw httpError(404, 'Payment not found');
  res.json(r);
});

exports.toggle = asyncHandler(async (req, res) => {
  const r = await Recurring.findOne({ _id: req.params.id, user: req.user._id });
  if (!r) throw httpError(404, 'Payment not found');
  r.status = r.status === 'active' ? 'inactive' : 'active';
  await r.save();
  res.json(r);
});

// Explicit "mark as paid": creates ONE expense and advances the due date.
// Because the due date moves forward atomically, the same cycle can't be paid twice.
exports.pay = asyncHandler(async (req, res) => {
  const current = await Recurring.findOne({ _id: req.params.id, user: req.user._id });
  if (!current) throw httpError(404, 'Payment not found');
  const r = await Recurring.findOneAndUpdate(
    { _id: current._id, user: req.user._id, nextDate: current.nextDate },
    { nextDate: addCycle(current.nextDate, current.cycle), lastPaidDate: new Date() },
    { new: true }
  );
  if (!r) throw httpError(409, 'This payment was already marked as paid');
  await Transaction.create({
    user: req.user._id, title: current.name, amount: current.amount, type: 'expense', category: current.category,
    date: new Date(), description: `Recurring ${current.cycle} payment`, paymentMethod: 'Other', tags: ['recurring'],
  });
  res.json(r);
});

exports.remove = asyncHandler(async (req, res) => {
  const r = await Recurring.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!r) throw httpError(404, 'Payment not found');
  res.json({ message: 'Deleted' });
});
