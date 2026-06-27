import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HeartHandshake, AlertCircle } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { Button } from '../components/ui/Button';
import { Input, Label } from '../components/ui/Input';

const DEMO_ACCOUNTS = [
  { label: 'Buyer', name: 'Anjali Rao', phone: '+12065550100' },
  { label: 'Parent', name: 'Lakshmi Rao', phone: '+919900000003' },
  { label: 'Care Manager', name: 'Ravi Kumar', phone: '+919900000001' },
  { label: 'Caregiver', name: 'Ramesh Naik', phone: '+919900000002' },
  { label: 'Admin', name: 'Priya Sharma', phone: '+919900000099' },
];

export default function Login() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const user = await login(phone, password);
      navigate(`/${user.role}`);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-brand-50 via-cream-100 to-cream-100 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-soft mb-3">
            <HeartHandshake className="h-6 w-6" />
          </span>
          <h1 className="text-2xl font-bold text-brand-700">MatruPitru</h1>
          <p className="text-stone-500 text-sm mt-1 text-center">
            Care your parents accept, visibility you can trust.
          </p>
        </div>

        <div className="bg-white rounded-card shadow-soft-lg border border-stone-100 p-7">
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91..." />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            {error && (
              <div className="flex items-center gap-2 text-sm text-rose-600 bg-rose-50 rounded-control px-3 py-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
            <Button type="submit" className="w-full" size="lg">
              Log in
            </Button>
          </form>
        </div>

        <p className="text-sm text-stone-500 text-center mt-6">
          New here?{' '}
          <Link to="/signup" className="text-brand-600 font-medium hover:underline">Create an account</Link>
        </p>

        <div className="mt-6">
          <p className="text-xs font-medium text-stone-400 uppercase tracking-wide text-center mb-3">
            Demo accounts &middot; password123
          </p>
          <div className="grid grid-cols-2 gap-2">
            {DEMO_ACCOUNTS.map((a) => (
              <button
                key={a.phone}
                type="button"
                onClick={() => setPhone(a.phone)}
                className="text-left rounded-control border border-stone-200 bg-white px-3 py-2.5 hover:border-brand-300 hover:bg-brand-50/50 transition-colors"
              >
                <div className="text-xs font-semibold text-brand-700">{a.label}</div>
                <div className="text-xs text-stone-500">{a.name}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
