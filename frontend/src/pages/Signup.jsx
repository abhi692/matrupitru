import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { HeartHandshake, AlertCircle } from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { Button } from '../components/ui/Button';
import { Input, Label } from '../components/ui/Input';
import { PhoneInput, isValidIndianPhone } from '../components/ui/PhoneInput';

// Public self-signup — always creates a buyer account (the backend enforces
// this too; see backend/src/modules/identity/routes.js). Parent/caregiver/
// care-manager/admin accounts are still provisioned internally, not here.
export default function Signup() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    if (!isValidIndianPhone(phone)) {
      setError('Enter a valid 10-digit Indian mobile number.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      const user = await register({ name, phone, password });
      navigate(`/${user.role}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-brand-50 via-cream-100 to-cream-100 px-4 py-12">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-500 text-white shadow-soft mb-3">
            <HeartHandshake className="h-6 w-6" />
          </span>
          <h1 className="text-2xl font-bold text-brand-700">Create your account</h1>
          <p className="text-stone-500 text-sm mt-1 text-center">
            Set up MatruPitru to coordinate care for your parent.
          </p>
        </div>

        <div className="bg-white rounded-card shadow-soft-lg border border-stone-100 p-7">
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Your name</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Anjali Rao" required />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <PhoneInput id="phone" value={phone} onChange={setPhone} />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" required />
            </div>
            <div>
              <Label htmlFor="confirmPassword">Confirm password</Label>
              <Input id="confirmPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
            </div>
            {error && (
              <div className="flex items-center gap-2 text-sm text-rose-600 bg-rose-50 rounded-control px-3 py-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </div>
            )}
            <Button type="submit" className="w-full" size="lg" disabled={submitting}>
              {submitting ? 'Creating account...' : 'Create account'}
            </Button>
          </form>
        </div>

        <p className="text-sm text-stone-500 text-center mt-6">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-600 font-medium hover:underline">Log in</Link>
        </p>
      </div>
    </div>
  );
}
