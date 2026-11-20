exports.asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

exports.httpError = (status, message) => {
  const e = new Error(message);
  e.status = status;
  return e;
};

exports.EXPENSE_CATEGORIES = ['Food', 'Shopping', 'Transportation', 'Rent', 'Utilities', 'Healthcare', 'Entertainment', 'Education', 'Travel', 'Groceries', 'Subscriptions', 'Other'];
exports.INCOME_CATEGORIES = ['Salary', 'Freelance', 'Business', 'Investments', 'Gifts', 'Other'];

const pad = (n) => String(n).padStart(2, '0');
exports.ymd = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
exports.ym = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
exports.monthRange = (month) => {
  const [y, m] = month.split('-').map(Number);
  return { start: new Date(y, m - 1, 1), end: new Date(y, m, 1) };
};
exports.pctChange = (cur, prev) => {
  if (!prev) return cur > 0 ? 100 : 0;
  return ((cur - prev) / Math.abs(prev)) * 100;
};
exports.round = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
exports.addCycle = (date, cycle) => {
  const d = new Date(date);
  if (cycle === 'weekly') d.setDate(d.getDate() + 7);
  else if (cycle === 'yearly') d.setFullYear(d.getFullYear() + 1);
  else d.setMonth(d.getMonth() + 1);
  return d;
};
exports.escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
