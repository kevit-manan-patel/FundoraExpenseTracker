import { Utensils, ShoppingBag, Car, Home, Zap, HeartPulse, Film, GraduationCap, Plane, ShoppingCart, Repeat, CircleDot, Wallet, Laptop, Briefcase, TrendingUp, Gift, PieChart } from 'lucide-react';

export const EXPENSE_CATEGORIES = ['Food', 'Shopping', 'Transportation', 'Rent', 'Utilities', 'Healthcare', 'Entertainment', 'Education', 'Travel', 'Groceries', 'Subscriptions', 'Other'];
export const INCOME_CATEGORIES = ['Salary', 'Freelance', 'Business', 'Investments', 'Gifts', 'Other'];
export const PAYMENT_METHODS = ['UPI', 'Card', 'Cash', 'Bank Transfer', 'Other'];

export const CAT_ICONS = { Food: Utensils, Shopping: ShoppingBag, Transportation: Car, Rent: Home, Utilities: Zap, Healthcare: HeartPulse, Entertainment: Film, Education: GraduationCap, Travel: Plane, Groceries: ShoppingCart, Subscriptions: Repeat, Other: CircleDot, Salary: Wallet, Freelance: Laptop, Business: Briefcase, Investments: TrendingUp, Gifts: Gift, Overall: PieChart };

// Neon fintech palette — glowing, distinguishable category colors for charts/icons.
export const CHART_SHADES = ['#00E5FF', '#FF4FD8', '#B6FF4A', '#A855F7', '#FFC857', '#00E5A0', '#FF5C70', '#6EE7F0', '#D48CFF', '#FFE08C', '#5FFFD1', '#FF8FA8'];
export const CAT_TONES = {
  Food: '#FFC857', Shopping: '#FF4FD8', Transportation: '#00E5FF', Rent: '#A855F7', Utilities: '#FFC857',
  Healthcare: '#FF5C70', Entertainment: '#FF4FD8', Education: '#00E5FF', Travel: '#A855F7', Groceries: '#B6FF4A',
  Subscriptions: '#A855F7', Other: '#A1A1AA', Salary: '#00E5A0', Freelance: '#00E5FF', Business: '#B6FF4A',
  Investments: '#00E5A0', Gifts: '#FF4FD8', Overall: '#00E5FF',
};

const LOCALES = { INR: 'en-IN', USD: 'en-US', EUR: 'de-DE', GBP: 'en-GB' };
export const money = (n, currency = 'INR', opts = {}) =>
  new Intl.NumberFormat(LOCALES[currency] || 'en-IN', { style: 'currency', currency, maximumFractionDigits: opts.decimals ?? 0, minimumFractionDigits: opts.decimals ?? 0 }).format(n || 0);
export const compact = (n, currency = 'INR') =>
  new Intl.NumberFormat(LOCALES[currency] || 'en-IN', { style: 'currency', currency, notation: 'compact', maximumFractionDigits: 1 }).format(n || 0);

export const fmtDate = (d, o = { day: 'numeric', month: 'short', year: 'numeric' }) => new Date(d).toLocaleDateString('en-IN', o);
const pad = (n) => String(n).padStart(2, '0');
export const toInputDate = (d = new Date()) => { const x = new Date(d); return `${x.getFullYear()}-${pad(x.getMonth() + 1)}-${pad(x.getDate())}`; };
export const thisMonth = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`; };
export const monthLabel = (m) => new Date(Number(m.slice(0, 4)), Number(m.slice(5)) - 1, 1).toLocaleDateString('en', { month: 'long', year: 'numeric' });

export const downloadCSV = (rows, name = 'fundora-transactions.csv') => {
  const head = ['Date', 'Title', 'Type', 'Category', 'Amount', 'Payment Method', 'Description', 'Notes', 'Tags'];
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const body = rows.map((t) => [toInputDate(t.date), t.title, t.type, t.category, t.amount, t.paymentMethod, t.description, t.notes, (t.tags || []).join('; ')].map(esc).join(','));
  const blob = new Blob([[head.join(','), ...body].join('\n')], { type: 'text/csv;charset=utf-8;' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name; a.click(); URL.revokeObjectURL(a.href);
};
