import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';

// MVP user story #1: onboard a parent + pick a plan in <15 minutes.
export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [familyId, setFamilyId] = useState(null);
  const [parent, setParent] = useState({
    name: '', phone: '', address: '', geoLat: '', geoLng: '', conditions: '',
  });
  const [tier, setTier] = useState('standard');
  const [error, setError] = useState('');
  const { setUser } = useAuth();
  const navigate = useNavigate();

  async function createFamily() {
    setError('');
    try {
      const family = await api.post('/families', { billingCurrency: 'USD' });
      setFamilyId(family.id);
      setUser((u) => ({ ...u, familyId: family.id }));
      setStep(2);
    } catch (err) {
      setError(err.message);
    }
  }

  async function addParent() {
    setError('');
    try {
      await api.post(`/families/${familyId}/parents`, {
        name: parent.name,
        phone: parent.phone,
        address: parent.address,
        geoLat: parent.geoLat ? Number(parent.geoLat) : undefined,
        geoLng: parent.geoLng ? Number(parent.geoLng) : undefined,
        conditions: parent.conditions ? parent.conditions.split(',').map((c) => c.trim()) : [],
      });
      setStep(3);
    } catch (err) {
      setError(err.message);
    }
  }

  async function choosePlan() {
    setError('');
    try {
      await api.post(`/families/${familyId}/care-plan`, { tier, recurringServices: ['attendant'] });
      navigate('/buyer');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="card onboarding">
      <h2>Onboard your parent</h2>
      <div className="steps">Step {step} of 3</div>
      {error && <div className="error">{error}</div>}

      {step === 1 && (
        <div>
          <p>First, we'll create your family account.</p>
          <button onClick={createFamily}>Create family</button>
        </div>
      )}

      {step === 2 && (
        <div className="form">
          <label>Parent name</label>
          <input value={parent.name} onChange={(e) => setParent({ ...parent, name: e.target.value })} />
          <label>Parent phone</label>
          <input value={parent.phone} onChange={(e) => setParent({ ...parent, phone: e.target.value })} />
          <label>Address</label>
          <input value={parent.address} onChange={(e) => setParent({ ...parent, address: e.target.value })} />
          <div className="row">
            <div>
              <label>Latitude (for visit geo-verification)</label>
              <input value={parent.geoLat} onChange={(e) => setParent({ ...parent, geoLat: e.target.value })} />
            </div>
            <div>
              <label>Longitude</label>
              <input value={parent.geoLng} onChange={(e) => setParent({ ...parent, geoLng: e.target.value })} />
            </div>
          </div>
          <label>Health conditions (comma separated)</label>
          <input value={parent.conditions} onChange={(e) => setParent({ ...parent, conditions: e.target.value })} />
          <button onClick={addParent}>Continue</button>
        </div>
      )}

      {step === 3 && (
        <div className="form">
          <label>Choose a care plan</label>
          <select value={tier} onChange={(e) => setTier(e.target.value)}>
            <option value="basic">Basic</option>
            <option value="standard">Standard</option>
            <option value="premium_nri">Premium (NRI)</option>
          </select>
          <button onClick={choosePlan}>Finish onboarding</button>
        </div>
      )}
    </div>
  );
}
