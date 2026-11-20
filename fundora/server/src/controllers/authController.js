const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Budget = require('../models/Budget');
const Goal = require('../models/Goal');
const Recurring = require('../models/Recurring');
const { asyncHandler, httpError } = require('../utils/helpers');

const sign = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
const pub = (u) => ({ id: u._id, name: u.name, email: u.email, currency: u.currency, theme: u.theme, avatar: u.avatar, notifications: { budgetAlerts: u.notifications?.budgetAlerts ?? true, billReminders: u.notifications?.billReminders ?? true } });
const emailOk = (e) => /^\S+@\S+\.\S+$/.test(e || '');

exports.register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !name.trim()) throw httpError(400, 'Name is required');
  if (!emailOk(email)) throw httpError(400, 'Enter a valid email address');
  if (!password || password.length < 6) throw httpError(400, 'Password must be at least 6 characters');
  if (await User.findOne({ email: email.toLowerCase() })) throw httpError(409, 'An account with this email already exists');
  const user = await User.create({ name, email, password });
  res.status(201).json({ token: sign(user._id), user: pub(user) });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) throw httpError(400, 'Email and password are required');
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
  if (!user || !(await user.matchPassword(password))) throw httpError(401, 'Invalid email or password');
  res.json({ token: sign(user._id), user: pub(user) });
});

exports.me = asyncHandler(async (req, res) => res.json({ user: pub(req.user) }));

exports.updateProfile = asyncHandler(async (req, res) => {
  const { name, email, currency, avatar, notifications } = req.body;
  const u = req.user;
  if (name !== undefined) {
    if (!name.trim()) throw httpError(400, 'Name cannot be empty');
    u.name = name;
  }
  if (email !== undefined && email.toLowerCase() !== u.email) {
    if (!emailOk(email)) throw httpError(400, 'Enter a valid email address');
    if (await User.findOne({ email: email.toLowerCase() })) throw httpError(409, 'Email already in use');
    u.email = email;
  }
  if (currency) u.currency = currency;
  if (avatar !== undefined) {
    if (avatar.length > 300000) throw httpError(400, 'Avatar image is too large (max ~200KB)');
    u.avatar = avatar;
  }
  if (notifications) {
    if (typeof notifications.budgetAlerts === 'boolean') u.notifications.budgetAlerts = notifications.budgetAlerts;
    if (typeof notifications.billReminders === 'boolean') u.notifications.billReminders = notifications.billReminders;
  }
  await u.save();
  res.json({ user: pub(u) });
});

exports.changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) throw httpError(400, 'New password must be at least 6 characters');
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.matchPassword(currentPassword || ''))) throw httpError(401, 'Current password is incorrect');
  user.password = newPassword;
  await user.save();
  res.json({ message: 'Password updated' });
});

exports.deleteAccount = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.matchPassword(req.body.password || ''))) throw httpError(401, 'Password is incorrect');
  const uid = user._id;
  await Promise.all([Transaction.deleteMany({ user: uid }), Budget.deleteMany({ user: uid }), Goal.deleteMany({ user: uid }), Recurring.deleteMany({ user: uid })]);
  await User.deleteOne({ _id: uid });
  res.json({ message: 'Account deleted' });
});
