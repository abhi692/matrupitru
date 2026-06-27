import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HeartHandshake, AlertCircle, MessageSquareText } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { Button } from '../components/ui/Button';
import { Input, Label } from '../components/ui/Input';
import { PhoneInput } from '../components/ui/PhoneInput';

// Anjali's a US-based NRI daughter (Seattle) coordinating care for her mother
// in Karnataka — her phone is intentionally a non-+91 number to reflect that.
// Demo accounts log straight in on tap instead of populating the phone field,
// so the India-only PhoneInput above never has to display a foreign number.
const DEMO_ACCOUNTS = [
  { label: 'Buyer', name: 'Anjali Rao', phone: '+12065550100' },
  { label: 'Parent', name: 'Lakshmi Rao', phone: '+919900000003' },
  { label: 'Care Manager', name: 'Ravi Kumar', phone: '+919900000001' },
  { label: 'Caregiver', name: 'Ramesh Naik', phone: '+919900000002' },
  { label: 'Admin', name: 'Priya Sharma', phone: '+919900000099' },
];

export default function Login() {
  const [mode, setMode] = useState('password'); // 'password' | 'otp'
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('password123');
  const [otpSent, setOtpSent] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { login, requestOtp, verifyOtp } = useAuth();
  const navigate = useNavigate();

  async function onPasswordSubmit(e) {
    e.preventDefault();
    setError('');
    try {
      const user = await login(phone, password);
      navigate(`/${user.role}`);
    } catch (err) {
      setError(err.message);
    }
  }

  async function onRequestOtp(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await requestOtp(phone);
      setOtpSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  async function onVerifyOtp(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const user = await verifyOtp(phone, code);
      navigate(`/${user.role}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function switchMode(next) {
    setMode(next);
    setError('');
    setOtpSent(false);
    setCode('');
  }

  async function quickLoginAsDemo(account) {
    setError('');
    try {
      const user = await login(account.phone, 'password123');
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
          <div className="flex rounded-control bg-stone-100 p-1 mb-5 text-sm font-medium">
            <button
              type="button"
              onClick={() => switchMode('password')}
              className={`flex-1 rounded-control py-1.5 transition-colors ${mode === 'password' ? 'bg-white text-brand-700 shadow-soft' : 'text-stone-500'}`}
            >
              Password
            </button>
            <button
              type="button"
              onClick={() => switchMode('otp')}
              className={`flex-1 rounded-control py-1.5 transition-colors ${mode === 'otp' ? 'bg-white text-brand-700 shadow-soft' : 'text-stone-500'}`}
            >
              OTP
            </button>
          </div>

          {mode === 'password' && (
            <form onSubmit={onPasswordSubmit} className="space-y-4">
              <div>
                <Label htmlFor="phone">Phone</Label>
                <PhoneInput id="phone" value={phone} onChange={setPhone} />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              {error && <ErrorNote>{error}</ErrorNote>}
              <Button type="submit" className="w-full" size="lg">
                Log in
              </Button>
            </form>
          )}

          {mode === 'otp' && !otpSent && (
            <form onSubmit={onRequestOtp} className="space-y-4">
              <div>
                <Label htmlFor="otpPhone">Phone</Label>
                <PhoneInput id="otpPhone" value={phone} onChange={setPhone} />
              </div>
              {error && <ErrorNote>{error}</ErrorNote>}
              <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                {submitting ? 'Sending...' : 'Send code'}
              </Button>
            </form>
          )}

          {mode === 'otp' && otpSent && (
            <form onSubmit={onVerifyOtp} className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-brand-700 bg-brand-50 rounded-control px-3 py-2">
                <MessageSquareText className="h-4 w-4 shrink-0" />
                A 6-digit code was sent to {phone}.
              </div>
              <div>
                <Label htmlFor="code">Code</Label>
                <Input id="code" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="123456" inputMode="numeric" />
              </div>
              {error && <ErrorNote>{error}</ErrorNote>}
              <Button type="submit" className="w-full" size="lg" disabled={submitting}>
                {submitting ? 'Verifying...' : 'Verify & log in'}
              </Button>
              <button type="button" onClick={() => setOtpSent(false)} className="w-full text-center text-sm text-stone-500 hover:text-brand-600">
                Use a different phone or resend
              </button>
            </form>
          )}
        </div>

        <p className="text-sm text-stone-500 text-center mt-6">
          New here?{' '}
          <Link to="/signup" className="text-brand-600 font-medium hover:underline">Create an account</Link>
        </p>

        <div className="mt-6">
          <p className="text-xs font-medium text-stone-400 uppercase tracking-wide text-center mb-3">
            Demo accounts &middot; tap to log in instantly
          </p>
          <div className="grid grid-cols-2 gap-2">
            {DEMO_ACCOUNTS.map((a) => (
              <button
                key={a.phone}
                type="button"
                onClick={() => quickLoginAsDemo(a)}
                className="text-left rounded-control border border-stone-200 bg-white px-3 py-2.5 hover:border-brand-300 hover:bg-brand-50/50 transition-colors"
              >
                <div className="text-xs font-semibold text-brand-700">{a.label}</div>
                <div className="text-xs text-stone-500">{a.name}</div>
              </button>
            ))}
          </div>
        </div>

        <p className="text-xs text-stone-400 text-center mt-8">
          <Link to="/privacy" className="hover:text-stone-600 hover:underline">Privacy Policy</Link>
        </p>
      </div>
    </div>
  );
}

function ErrorNote({ children }) {
  return (
    <div className="flex items-center gap-2 text-sm text-rose-600 bg-rose-50 rounded-control px-3 py-2">
      <AlertCircle className="h-4 w-4 shrink-0" />
      {children}
    </div>
  );
}
