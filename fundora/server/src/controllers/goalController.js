const Goal = require('../models/Goal');
const { asyncHandler, httpError } = require('../utils/helpers');

const pick = (b) => {
  const out = { name: b.name, description: b.description || '' };
  if (b.targetAmount !== undefined) out.targetAmount = Number(b.targetAmount);
  if (b.currentAmount !== undefined && b.currentAmount !== '') out.currentAmount = Number(b.currentAmount);
  out.targetDate = b.targetDate ? new Date(b.targetDate) : undefined;
  return out;
};

exports.list = asyncHandler(async (req, res) => {
  res.json(await Goal.find({ user: req.user._id }).sort({ createdAt: -1 }).lean());
});

exports.create = asyncHandler(async (req, res) => {
  res.status(201).json(await Goal.create({ ...pick(req.body), user: req.user._id }));
});

exports.update = asyncHandler(async (req, res) => {
  const g = await Goal.findOne({ _id: req.params.id, user: req.user._id });
  if (!g) throw httpError(404, 'Goal not found');
  Object.assign(g, pick(req.body));
  await g.save();
  res.json(g);
});

exports.contribute = asyncHandler(async (req, res) => {
  const amount = Number(req.body.amount);
  if (!amount || amount <= 0) throw httpError(400, 'Contribution must be greater than 0');
  const g = await Goal.findOne({ _id: req.params.id, user: req.user._id });
  if (!g) throw httpError(404, 'Goal not found');
  g.currentAmount += amount;
  g.contributions.push({ amount });
  await g.save();
  res.json(g);
});

exports.remove = asyncHandler(async (req, res) => {
  const g = await Goal.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!g) throw httpError(404, 'Goal not found');
  res.json({ message: 'Deleted' });
});
