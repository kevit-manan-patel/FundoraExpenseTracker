import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AuthShell from '../components/AuthShell.jsx';
import { Button } from '../components/UI.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { errMsg } from '../api';

export default function Register() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [f, setF] = useState({ name: '', email: '', password: '' });
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    if (!f.name.trim()) return toast.error('Enter your name');
    if (!/^\S+@\S+\.\S+$/.test(f.email)) return toast.error('Enter a valid email');
    if (f.password.length < 6) return toast.error('Password must be at least 6 characters');
    setBusy(true);
    try { await register(f.name, f.email, f.password); toast.success('Welcome to Fundora'); nav('/'); } catch (err) { toast.error(errMsg(err)); } finally { setBusy(false); }
  };
  return (
    <AuthShell title="Create your account" subtitle="Start tracking in under a minute." footer={<>Already have an account? <Link to="/login" className="text-neon-cyan hover:underline">Log in</Link></>}>
      <form onSubmit={submit} className="space-y-4">
        <div><label className="label">Full name</label><input className="input" autoFocus value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
        <div><label className="label">Email</label><input className="input" type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
        <div><label className="label">Password</label><input className="input" type="password" placeholder="At least 6 characters" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></div>
        <Button type="submit" loading={busy} className="w-full !py-2.5">Create account</Button>
      </form>
    </AuthShell>
  );
}
