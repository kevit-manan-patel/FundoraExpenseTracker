import { useState } from 'react';
import toast from 'react-hot-toast';
import { Upload, LogOut, Trash2 } from 'lucide-react';
import api, { errMsg } from '../api';
import { useAuth } from '../context/AuthContext.jsx';
import { Avatar } from '../components/Layout.jsx';
import { PageHeader, Button } from '../components/UI.jsx';
import { money } from '../utils/format';

function Section({ title, sub, children }) {
  return <div className="card p-6"><h3 className="font-semibold">{title}</h3>{sub && <p className="mb-5 mt-1 text-xs text-muted">{sub}</p>}{!sub && <div className="mb-5" />}{children}</div>;
}
const Toggle = ({ on, onChange, label, hint }) => (
  <div className="flex items-center justify-between py-2"><div><p className="text-sm">{label}</p><p className="text-xs text-muted">{hint}</p></div>
    <button type="button" onClick={() => onChange(!on)} className={`relative h-6 w-11 rounded-full transition-colors ${on ? 'bg-pos' : 'bg-line'}`}><span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${on ? 'left-[22px]' : 'left-0.5'}`} /></button></div>
);

export default function Settings() {
  const { user, setUser, logout } = useAuth();
  const [p, setP] = useState({ name: user.name, email: user.email, avatar: user.avatar || '' });
  const [currency, setCurrency] = useState(user.currency);
  const [notif, setNotif] = useState(user.notifications);
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  const [busy, setBusy] = useState('');
  const [delPw, setDelPw] = useState('');

  const save = async (key, body, msg) => {
    setBusy(key);
    try { const { data } = await api.put('/auth/profile', body); setUser(data.user); toast.success(msg); } catch (e) { toast.error(errMsg(e)); } finally { setBusy(''); }
  };
  const onFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return toast.error('Choose an image file');
    const img = new Image();
    img.onload = () => {
      const s = 160, cv = document.createElement('canvas'); cv.width = cv.height = s;
      const m = Math.min(img.width, img.height);
      cv.getContext('2d').drawImage(img, (img.width - m) / 2, (img.height - m) / 2, m, m, 0, 0, s, s);
      setP((x) => ({ ...x, avatar: cv.toDataURL('image/jpeg', 0.8) }));
    };
    img.src = URL.createObjectURL(file);
  };
  const changePw = async (e) => {
    e.preventDefault();
    if (pw.newPassword.length < 6) return toast.error('New password must be at least 6 characters');
    if (pw.newPassword !== pw.confirm) return toast.error('Passwords do not match');
    setBusy('pw');
    try { await api.put('/auth/password', { currentPassword: pw.currentPassword, newPassword: pw.newPassword }); toast.success('Password updated'); setPw({ currentPassword: '', newPassword: '', confirm: '' }); } catch (err) { toast.error(errMsg(err)); } finally { setBusy(''); }
  };

  const deleteAccount = async () => {
    if (!delPw) return toast.error('Enter your password to confirm');
    if (!confirm('This permanently deletes your account and ALL your data. Continue?')) return;
    setBusy('del');
    try { await api.delete('/auth/account', { data: { password: delPw } }); toast.success('Account deleted'); logout(); } catch (e) { toast.error(errMsg(e)); } finally { setBusy(''); }
  };

  return (
    <div className="max-w-3xl">
      <PageHeader title="Settings" subtitle="Your profile, preferences and security." />
      <div className="space-y-4">
        <Section title="Profile">
          <div className="mb-5 flex items-center gap-4">
            <Avatar user={{ ...user, avatar: p.avatar }} size="h-16 w-16" />
            <label className="btn-ghost cursor-pointer"><Upload className="h-4 w-4" />Upload photo<input type="file" accept="image/*" hidden onChange={onFile} /></label>
            {p.avatar && <button className="text-xs text-muted hover:text-neg transition-colors" onClick={() => setP({ ...p, avatar: '' })}>Remove</button>}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label">Name</label><input className="input" value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} /></div>
            <div><label className="label">Email</label><input className="input" type="email" value={p.email} onChange={(e) => setP({ ...p, email: e.target.value })} /></div>
          </div>
          <div className="mt-5 flex justify-end"><Button loading={busy === 'profile'} onClick={() => save('profile', p, 'Profile saved')}>Save profile</Button></div>
        </Section>

        <Section title="Currency" sub="Changes how amounts are displayed. No conversion is applied: stored numbers stay exactly as you entered them.">
          <div className="flex flex-wrap items-center gap-3">
            <select className="input !w-auto" value={currency} onChange={(e) => setCurrency(e.target.value)}>{['INR', 'USD', 'EUR', 'GBP'].map((x) => <option key={x}>{x}</option>)}</select>
            <span className="text-sm text-muted">Preview: {money(123456.5, currency, { decimals: 2 })}</span>
            <Button className="ml-auto" loading={busy === 'cur'} onClick={() => save('cur', { currency }, 'Currency updated')}>Save</Button>
          </div>
        </Section>

        <Section title="Notifications" sub="Controls the alerts shown in the bell menu.">
          <Toggle on={notif.budgetAlerts} onChange={(v) => setNotif({ ...notif, budgetAlerts: v })} label="Budget alerts" hint="At 75%, 90% and 100% of a budget" />
          <Toggle on={notif.billReminders} onChange={(v) => setNotif({ ...notif, billReminders: v })} label="Bill reminders" hint="Recurring payments due within 7 days" />
          <div className="mt-3 flex justify-end"><Button loading={busy === 'n'} onClick={() => save('n', { notifications: notif }, 'Preferences saved')}>Save preferences</Button></div>
        </Section>

        <Section title="Change password">
          <form onSubmit={changePw} className="grid gap-4 sm:grid-cols-3">
            <div><label className="label">Current</label><input className="input" type="password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} /></div>
            <div><label className="label">New</label><input className="input" type="password" value={pw.newPassword} onChange={(e) => setPw({ ...pw, newPassword: e.target.value })} /></div>
            <div><label className="label">Confirm</label><input className="input" type="password" value={pw.confirm} onChange={(e) => setPw({ ...pw, confirm: e.target.value })} /></div>
            <div className="sm:col-span-3 flex justify-end"><Button type="submit" loading={busy === 'pw'}>Update password</Button></div>
          </form>
        </Section>

        <Section title="Account"><div className="flex items-center justify-between"><p className="text-sm text-muted">Signed in as {user.email}</p><Button variant="ghost" onClick={logout}><LogOut className="h-4 w-4" />Log out</Button></div></Section>

        <Section title="Danger zone" sub="Permanently delete your account and every transaction, budget, goal and payment. This cannot be undone.">
          <div className="flex flex-wrap items-center gap-3"><input className="input !w-64" type="password" placeholder="Confirm with your password" value={delPw} onChange={(e) => setDelPw(e.target.value)} /><Button variant="danger" loading={busy === 'del'} onClick={deleteAccount}><Trash2 className="h-4 w-4" />Delete account</Button></div>
        </Section>
      </div>
    </div>
  );
}
