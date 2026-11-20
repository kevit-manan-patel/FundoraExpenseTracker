const Transaction = require('../models/Transaction');
const budgetUsage = require('../utils/budgetUsage');
const { asyncHandler, httpError, EXPENSE_CATEGORIES, INCOME_CATEGORIES, escapeRegex } = require('../utils/helpers');

const clean = (b) => {
  const type = b.type;
  if (!['income', 'expense'].includes(type)) throw httpError(400, 'Type must be income or expense');
  const allowed = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  if (!allowed.includes(b.category)) throw httpError(400, `Invalid ${type} category`);
  const amount = Number(b.amount);
  if (!amount || amount <= 0) throw httpError(400, 'Amount must be greater than 0');
  const date = b.date ? new Date(b.date) : new Date();
  if (isNaN(date)) throw httpError(400, 'Invalid date');
  const tags = Array.isArray(b.tags) ? b.tags : String(b.tags || '').split(',');
  return {
    title: b.title, amount, type, category: b.category, date,
    description: b.description || '', notes: b.notes || '',
    paymentMethod: b.paymentMethod || 'UPI',
    tags: tags.map((t) => t.trim()).filter(Boolean).slice(0, 10),
  };
};

exports.list = asyncHandler(async (req, res) => {
  const { q, type, category, from, to, min, max, sort = 'date_desc' } = req.query;
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.min(Math.max(parseInt(req.query.limit) || 10, 1), 5000);
  const f = { user: req.user._id };
  if (type) f.type = type;
  if (category) f.category = category;
  if (from || to) {
    f.date = {};
    if (from) f.date.$gte = new Date(from + 'T00:00:00');
    if (to) f.date.$lte = new Date(to + 'T23:59:59.999');
  }
  if (min || max) {
    f.amount = {};
    if (min) f.amount.$gte = Number(min);
    if (max) f.amount.$lte = Number(max);
  }
  if (q && q.trim()) {
    const rx = new RegExp(escapeRegex(q.trim()), 'i');
    f.$or = [{ title: rx }, { category: rx }, { description: rx }, { tags: rx }];
  }
  const sorts = { date_desc: { date: -1, _id: -1 }, date_asc: { date: 1, _id: 1 }, amount_desc: { amount: -1 }, amount_asc: { amount: 1 } };
  const [items, total] = await Promise.all([
    Transaction.find(f).sort(sorts[sort] || sorts.date_desc).skip((page - 1) * limit).limit(limit).lean(),
    Transaction.countDocuments(f),
  ]);
  res.json({ items, total, page, pages: Math.max(Math.ceil(total / limit), 1) });
});

exports.create = asyncHandler(async (req, res) => {
  const t = await Transaction.create({ ...clean(req.body), user: req.user._id });
  // Budget alerts: report any 75% / 90% / 100% threshold this expense just crossed
  const budgetAlerts = [];
  if (t.type === 'expense' && req.user.notifications?.budgetAlerts !== false) {
    const d = t.date;
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const usage = await budgetUsage(req.user._id, month);
    usage.filter((b) => b.category === t.category || b.category === 'Overall').forEach((b) => {
      const before = ((b.spent - t.amount) / b.amount) * 100;
      const crossed = [100, 90, 75].find((th) => before < th && b.percent >= th);
      if (crossed) budgetAlerts.push({ category: b.category, threshold: crossed, percent: Math.round(b.percent) });
    });
  }
  res.status(201).json({ ...t.toObject(), budgetAlerts });
});

exports.update = asyncHandler(async (req, res) => {
  const t = await Transaction.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, clean(req.body), { new: true, runValidators: true });
  if (!t) throw httpError(404, 'Transaction not found');
  res.json(t);
});

exports.remove = asyncHandler(async (req, res) => {
  const t = await Transaction.findOneAndDelete({ _id: req.params.id, user: req.user._id });
  if (!t) throw httpError(404, 'Transaction not found');
  res.json({ message: 'Deleted' });
});
