const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');
const { monthRange, round } = require('./helpers');

module.exports = async function budgetUsage(userId, month) {
  const { start, end } = monthRange(month);
  const [budgets, spentAgg] = await Promise.all([
    Budget.find({ user: userId, month }).sort({ category: 1 }).lean(),
    Transaction.aggregate([
      { $match: { user: userId, type: 'expense', date: { $gte: start, $lt: end } } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
    ]),
  ]);
  const byCat = Object.fromEntries(spentAgg.map((s) => [s._id, s.total]));
  const totalSpent = spentAgg.reduce((a, s) => a + s.total, 0);
  return budgets.map((b) => {
    const spent = b.category === 'Overall' ? totalSpent : byCat[b.category] || 0;
    const percent = b.amount > 0 ? (spent / b.amount) * 100 : 0;
    return { ...b, spent: round(spent), remaining: round(b.amount - spent), percent: round(percent) };
  });
};
