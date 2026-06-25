import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

const DEMO_ACCOUNTS = [
  { label: 'Buyer — Anjali Rao', phone: '+12065550100' },
  { label: 'Parent — Lakshmi Rao', phone: '+919900000003' },
  { label: 'Care Manager — Ravi Kumar', phone: '+919900000001' },
  { label: 'Caregiver — Ramesh Naik', phone: '+919900000002' },
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
    <div className="auth-screen">
      <div className="auth-card">
        <h1>MatruPitru</h1>
        <p className="subtitle">Care your parents accept, visibility you can trust.</p>
        <form onSubmit={onSubmit}>
          <label>Phone</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91..." />
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          {error && <div className="error">{error}</div>}
          <button type="submit">Log in</button>
        </form>
        <div className="demo-accounts">
          <p>Demo accounts (password: password123):</p>
          <ul>
            {DEMO_ACCOUNTS.map((a) => (
              <li key={a.phone}>
                <button type="button" onClick={() => setPhone(a.phone)}>
                  {a.label}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
