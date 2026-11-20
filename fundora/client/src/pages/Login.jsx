import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthShell from '../components/AuthShell.jsx';
import { Button } from '../components/UI.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { errMsg } from '../api';

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    if (!f.email || !f.password) return toast.error('Enter your email and password');
    setBusy(true);
    try { await login(f.email, f.password); nav('/'); } catch (err) { toast.error(errMsg(err)); } finally { setBusy(false); }
  };
  return (
    <AuthShell title="Welcome back" subtitle="Log in to your Fundora workspace." footer={<>New here? <Link to="/register" className="text-neon-cyan hover:underline">Create an account</Link></>}>
      <form onSubmit={submit} className="space-y-4">
        <div><label className="label">Email</label><input className="input" type="email" autoFocus placeholder="you@example.com" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
        <div><label className="label">Password</label><input className="input" type="password" placeholder="••••••••" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></div>
        <Button type="submit" loading={busy} className="w-full !py-2.5">Log in</Button>
      </form>
    </AuthShell>
  );
}
