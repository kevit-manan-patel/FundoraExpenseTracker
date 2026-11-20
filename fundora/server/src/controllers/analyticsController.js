const Transaction = require('../models/Transaction');
const budgetUsage = require('../utils/budgetUsage');
const Recurring = require('../models/Recurring');
const Goal = require('../models/Goal');
const { asyncHandler, httpError, ymd, ym, pctChange, round, addCycle } = require('../utils/helpers');

const sum = (arr, type) => arr.filter((t) => t.type === type).reduce((a, t) => a + t.amount, 0);
const clamp = (n) => Math.max(0, Math.min(100, n));
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

exports.overview = asyncHandler(async (req, res) => {
  const uid = req.user._id;
  const range = ['week', 'month', 'year'].includes(req.query.range) ? req.query.range : 'month';
  const now = new Date();
  const startThis = new Date(now.getFullYear(), now.getMonth(), 1);
  const startPrev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const startYear = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  const [txns, allTime, recent] = await Promise.all([
    Transaction.find({ user: uid, date: { $gte: startYear } }).lean(),
    Transaction.aggregate([{ $match: { user: uid } }, { $group: { _id: '$type', total: { $sum: '$amount' } } }]),
    Transaction.find({ user: uid }).sort({ date: -1, _id: -1 }).limit(8).lean(),
  ]);
  const at = Object.fromEntries(allTime.map((a) => [a._id, a.total]));
  const balance = (at.income || 0) - (at.expense || 0);

  const thisM = txns.filter((t) => t.date >= startThis);
  const prevM = txns.filter((t) => t.date >= startPrev && t.date < startThis);
  const inc = sum(thisM, 'income'), exp = sum(thisM, 'expense');
  const pInc = sum(prevM, 'income'), pExp = sum(prevM, 'expense');
  const rate = inc > 0 ? ((inc - exp) / inc) * 100 : 0;
  const pRate = pInc > 0 ? ((pInc - pExp) / pInc) * 100 : 0;
  const prevBalance = balance - (inc - exp);

  // cash flow buckets
  let buckets = [];
  if (range === 'year') {
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({ key: ym(d), label: MONTHS[d.getMonth()], income: 0, expense: 0 });
    }
  } else {
    const days = range === 'week' ? 7 : 30;
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      buckets.push({ key: ymd(d), label: range === 'week' ? d.toLocaleDateString('en', { weekday: 'short' }) : `${d.getDate()} ${MONTHS[d.getMonth()]}`, income: 0, expense: 0 });
    }
  }
  const idx = Object.fromEntries(buckets.map((b, i) => [b.key, i]));
  txns.forEach((t) => {
    const k = range === 'year' ? ym(t.date) : ymd(t.date);
    if (idx[k] !== undefined) buckets[idx[k]][t.type] += t.amount;
  });
  buckets = buckets.map((b) => ({ ...b, income: round(b.income), expense: round(b.expense) }));

  // category breakdown (this month)
  const catMap = {};
  thisM.filter((t) => t.type === 'expense').forEach((t) => { catMap[t.category] = (catMap[t.category] || 0) + t.amount; });
  const categories = Object.entries(catMap).map(([name, value]) => ({ name, value: round(value), percent: exp ? round((value / exp) * 100) : 0 })).sort((a, b) => b.value - a.value);

  // financial health
  const budgets = await budgetUsage(uid, ym(now));
  const dayMap = {};
  thisM.filter((t) => t.type === 'expense').forEach((t) => { const k = ymd(t.date); dayMap[k] = (dayMap[k] || 0) + t.amount; });
  const daily = Array.from({ length: now.getDate() }, (_, i) => dayMap[ymd(new Date(now.getFullYear(), now.getMonth(), i + 1))] || 0);
  const mean = daily.reduce((a, b) => a + b, 0) / (daily.length || 1);
  const sd = Math.sqrt(daily.reduce((a, b) => a + (b - mean) ** 2, 0) / (daily.length || 1));
  const consistency = mean > 0 ? clamp(100 - (sd / mean) * 25) : null;
  const adherence = budgets.length ? (budgets.filter((b) => b.percent <= 100).length / budgets.length) * 100 : null;
  const last3 = txns.filter((t) => t.type === 'expense' && t.date >= new Date(now.getFullYear(), now.getMonth() - 3, 1) && t.date < startThis);
  const avgMonthly = last3.reduce((a, t) => a + t.amount, 0) / 3;
  const emergency = avgMonthly > 0 ? clamp((balance / (avgMonthly * 3)) * 100) : null;
  const savingsScore = inc > 0 ? clamp((rate / 20) * 100) : null;
  const parts = [savingsScore, consistency, adherence, emergency].filter((v) => v !== null);
  const health = {
    savings: savingsScore === null ? null : Math.round(savingsScore),
    consistency: consistency === null ? null : Math.round(consistency),
    adherence: adherence === null ? null : Math.round(adherence),
    emergency: emergency === null ? null : Math.round(emergency),
    score: parts.length ? Math.round(parts.reduce((a, b) => a + b, 0) / parts.length) : null,
  };

  res.json({
    cards: {
      balance: { value: round(balance), change: round(pctChange(balance, prevBalance)) },
      income: { value: round(inc), change: round(pctChange(inc, pInc)) },
      expense: { value: round(exp), change: round(pctChange(exp, pExp)) },
      savingsRate: { value: round(rate), change: round(rate - pRate) },
    },
    cashflow: buckets, categories, recent, health,
  });
});

const rangeDates = (q) => {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  let start;
  switch (q.range) {
    case '7d': start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6); break;
    case '3m': start = new Date(now.getFullYear(), now.getMonth() - 2, 1); break;
    case '6m': start = new Date(now.getFullYear(), now.getMonth() - 5, 1); break;
    case 'ytd': start = new Date(now.getFullYear(), 0, 1); break;
    case 'custom': {
      const s = q.from ? new Date(q.from + 'T00:00:00') : null;
      const e = q.to ? new Date(q.to + 'T23:59:59.999') : end;
      if (s && !isNaN(s) && !isNaN(e)) return { start: s, end: e };
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29); break;
    }
    default: start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 29);
  }
  return { start, end };
};

exports.report = asyncHandler(async (req, res) => {
  const { start, end } = rangeDates(req.query);
  const txns = await Transaction.find({ user: req.user._id, date: { $gte: start, $lte: end } }).sort({ date: 1 }).lean();
  const expenses = txns.filter((t) => t.type === 'expense');
  const income = sum(txns, 'income'), expense = sum(txns, 'expense');

  const catMap = {};
  expenses.forEach((t) => { catMap[t.category] = (catMap[t.category] || 0) + t.amount; });
  const byCategory = Object.entries(catMap).map(([name, value]) => ({ name, value: round(value), percent: expense ? round((value / expense) * 100) : 0 })).sort((a, b) => b.value - a.value);

  const dayMap = {};
  expenses.forEach((t) => { const k = ymd(t.date); dayMap[k] = (dayMap[k] || 0) + t.amount; });
  const byDay = Object.entries(dayMap).map(([date, amount]) => ({ date, amount: round(amount) })).sort((a, b) => a.date.localeCompare(b.date));

  const monMap = {};
  txns.forEach((t) => {
    const k = ym(t.date);
    monMap[k] = monMap[k] || { month: k, income: 0, expense: 0 };
    monMap[k][t.type] += t.amount;
  });
  const byMonth = Object.values(monMap).sort((a, b) => a.month.localeCompare(b.month)).map((m) => ({
    ...m, income: round(m.income), expense: round(m.expense), savings: round(m.income - m.expense),
    label: `${MONTHS[Number(m.month.slice(5)) - 1]} ${m.month.slice(2, 4)}`,
  }));

  const top = [...expenses].sort((a, b) => b.amount - a.amount).slice(0, 8);
  const days = Math.max(1, Math.round((end - start) / 86400000));
  res.json({
    range: { from: ymd(start), to: ymd(end) },
    totals: { income: round(income), expense: round(expense), net: round(income - expense), savingsRate: income > 0 ? round(((income - expense) / income) * 100) : 0, avgDaily: round(expense / days), count: txns.length },
    byCategory, byDay, byMonth, top,
  });
});

// Per-day income/expense totals + projected recurring bills + goal deadlines for a date range.
// Used by the Financial Calendar and the Spending Heatmap.
exports.daily = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const start = new Date(`${from}T00:00:00`), end = new Date(`${to}T23:59:59.999`);
  if (!from || !to || isNaN(start) || isNaN(end) || end < start) throw httpError(400, 'Valid from and to dates are required');
  if (end - start > 400 * 86400000) throw httpError(400, 'Range too large (max 400 days)');
  const uid = req.user._id;
  const [txns, recurring, goals] = await Promise.all([
    Transaction.find({ user: uid, date: { $gte: start, $lte: end } }).select('date type amount').lean(),
    Recurring.find({ user: uid, status: 'active' }).lean(),
    Goal.find({ user: uid, targetDate: { $gte: start, $lte: end } }).select('name targetDate currentAmount targetAmount').lean(),
  ]);
  const days = {};
  txns.forEach((t) => {
    const k = ymd(t.date);
    days[k] = days[k] || { income: 0, expense: 0, count: 0 };
    days[k][t.type] += t.amount;
    days[k].count += 1;
  });
  Object.values(days).forEach((d) => { d.income = round(d.income); d.expense = round(d.expense); });
  const bills = [];
  recurring.forEach((r) => {
    let d = new Date(r.nextDate);
    for (let i = 0; i < 400 && d <= end; i++) {
      if (d >= start) bills.push({ date: ymd(d), name: r.name, amount: r.amount, cycle: r.cycle });
      d = addCycle(d, r.cycle);
    }
  });
  res.json({
    days, bills,
    goals: goals.map((g) => ({ date: ymd(g.targetDate), name: g.name, done: g.currentAmount >= g.targetAmount })),
  });
});
