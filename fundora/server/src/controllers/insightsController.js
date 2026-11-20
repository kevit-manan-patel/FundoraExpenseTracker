const Transaction = require('../models/Transaction');
const Recurring = require('../models/Recurring');
const budgetUsage = require('../utils/budgetUsage');
const { asyncHandler, ym, pctChange, round } = require('../utils/helpers');

const DISCRETIONARY = ['Shopping', 'Entertainment', 'Travel', 'Food'];

exports.get = asyncHandler(async (req, res) => {
  const uid = req.user._id;
  const now = new Date();
  const startThis = new Date(now.getFullYear(), now.getMonth(), 1);
  const startPrev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const [txns, budgets, recurring] = await Promise.all([
    Transaction.find({ user: uid, date: { $gte: startPrev } }).lean(),
    budgetUsage(uid, ym(now)),
    Recurring.find({ user: uid, status: 'active' }).lean(),
  ]);
  const cur = txns.filter((t) => t.date >= startThis);
  const prev = txns.filter((t) => t.date < startThis);
  const tot = (a, type) => a.filter((t) => t.type === type).reduce((s, t) => s + t.amount, 0);
  const income = tot(cur, 'income'), expense = tot(cur, 'expense');
  const pIncome = tot(prev, 'income'), pExpense = tot(prev, 'expense');
  const rate = income > 0 ? ((income - expense) / income) * 100 : 0;
  const pRate = pIncome > 0 ? ((pIncome - pExpense) / pIncome) * 100 : 0;

  const byCat = (a) => a.filter((t) => t.type === 'expense').reduce((m, t) => ({ ...m, [t.category]: (m[t.category] || 0) + t.amount }), {});
  const cCat = byCat(cur), pCat = byCat(prev);
  const cats = [...new Set([...Object.keys(cCat), ...Object.keys(pCat)])].map((name) => ({
    name, current: round(cCat[name] || 0), previous: round(pCat[name] || 0), change: round(pctChange(cCat[name] || 0, pCat[name] || 0)),
  }));
  const spikes = cats.filter((c) => c.previous > 0 && c.change >= 20 && c.current - c.previous > 0).sort((a, b) => b.change - a.change);
  const drops = cats.filter((c) => c.previous > 0 && c.change <= -10).sort((a, b) => a.change - b.change);
  const topCat = Object.entries(cCat).sort((a, b) => b[1] - a[1])[0];
  const biggest = cur.filter((t) => t.type === 'expense').sort((a, b) => b.amount - a.amount)[0];

  // personality
  const exps = cur.filter((t) => t.type === 'expense');
  let personality = { name: 'Not enough data', description: 'Add more transactions this month to reveal your spending personality.', signals: [] };
  if (exps.length >= 5) {
    const discShare = (exps.filter((t) => DISCRETIONARY.includes(t.category)).reduce((s, t) => s + t.amount, 0) / expense) * 100;
    const adherence = budgets.length ? (budgets.filter((b) => b.percent <= 100).length / budgets.length) * 100 : null;
    const categoriesUsed = Object.keys(cCat).length;
    const dayTotals = {};
    exps.forEach((t) => { const k = t.date.getDate(); dayTotals[k] = (dayTotals[k] || 0) + t.amount; });
    const maxDayShare = (Math.max(...Object.values(dayTotals)) / expense) * 100;
    const signals = [`Savings rate ${round(rate)}%`, `Discretionary share ${Math.round(discShare)}%`, `${categoriesUsed} spending categories`];
    if (adherence !== null) signals.push(`Budget adherence ${Math.round(adherence)}%`);
    if (rate >= 30) personality = { name: 'The Saver', description: 'You keep a large slice of what you earn. Spending is controlled and savings come first.', signals };
    else if (adherence !== null && adherence >= 80) personality = { name: 'The Planner', description: 'You set budgets and actually stay inside them. Your spending follows a plan.', signals };
    else if (discShare >= 45 && (maxDayShare >= 30 || rate < 10)) personality = { name: 'The Impulsive Spender', description: 'A large share of your spending goes to wants, often in concentrated bursts. A budget would help.', signals };
    else personality = { name: 'The Explorer', description: 'Your spending is spread across many categories and experiences. Balanced, but worth watching.', signals };
  }

  // recommendations
  const recs = [];
  spikes.slice(0, 3).forEach((c) => recs.push({ level: 'warn', text: `Your ${c.name.toLowerCase()} spending increased by ${Math.round(c.change)}% compared to last month.` }));
  budgets.filter((b) => b.percent >= 75).forEach((b) => recs.push({ level: b.percent >= 100 ? 'danger' : 'warn', text: `You have used ${Math.round(b.percent)}% of your ${b.category.toLowerCase()} budget.` }));
  if (pIncome > 0 && income > 0) {
    const d = rate - pRate;
    if (d >= 1) recs.push({ level: 'good', text: `Your savings rate improved by ${round(d)} percentage points.` });
    else if (d <= -1) recs.push({ level: 'warn', text: `Your savings rate dropped by ${round(Math.abs(d))} percentage points.` });
  }
  if (income > 0 && expense > income) recs.push({ level: 'danger', text: 'You are spending more than you earned this month.' });
  if (recurring.length >= 3) recs.push({ level: 'info', text: `You have ${recurring.length} active recurring payments. Review any you no longer use.` });
  if (!budgets.length) recs.push({ level: 'info', text: 'You have no budgets set for this month. Create one to get spending alerts.' });
  if (drops[0]) recs.push({ level: 'good', text: `Nice work: ${drops[0].name.toLowerCase()} spending is down ${Math.abs(Math.round(drops[0].change))}% from last month.` });
  if (!recs.length) recs.push({ level: 'info', text: 'Add more transactions to unlock personalised recommendations.' });

  // alerts (for notification bell)
  const alerts = [];
  if (req.user.notifications.budgetAlerts) {
    budgets.forEach((b) => {
      if (b.percent >= 100) alerts.push({ level: 'danger', text: `${b.category} budget exceeded (${Math.round(b.percent)}%)` });
      else if (b.percent >= 90) alerts.push({ level: 'danger', text: `${b.category} budget at ${Math.round(b.percent)}%` });
      else if (b.percent >= 75) alerts.push({ level: 'warn', text: `${b.category} budget at ${Math.round(b.percent)}%` });
    });
  }
  if (req.user.notifications.billReminders) {
    const soon = new Date(now.getTime() + 7 * 86400000);
    recurring.filter((r) => r.nextDate <= soon).forEach((r) => alerts.push({ level: r.nextDate < now ? 'danger' : 'info', text: `${r.name} ${r.nextDate < now ? 'is overdue' : 'is due soon'}`, date: r.nextDate }));
  }

  res.json({
    summary: { income: round(income), expense: round(expense), savingsRate: round(rate), topCategory: topCat ? { name: topCat[0], amount: round(topCat[1]) } : null, biggest: biggest ? { title: biggest.title, amount: biggest.amount, category: biggest.category } : null, improvement: drops[0] || null },
    patterns: spikes, categories: cats.sort((a, b) => b.current - a.current), personality, recommendations: recs, alerts,
  });
});
