import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, AlertCircle, UserPlus, MapPin, ShieldCheck } from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { Card, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Label } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { cn } from '../../lib/utils';

const STEPS = [
  { n: 1, label: 'Create family', icon: UserPlus },
  { n: 2, label: 'Parent details', icon: MapPin },
  { n: 3, label: 'Care plan', icon: ShieldCheck },
];

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
    <div className="max-w-xl mx-auto">
      <h2 className="text-2xl font-bold text-stone-900 mb-1">Onboard your parent</h2>
      <p className="text-stone-500 text-sm mb-6">A few quick steps and you're set up.</p>

      <div className="flex items-center mb-8">
        {STEPS.map((s, i) => (
          <div key={s.n} className="flex items-center flex-1 last:flex-initial">
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={cn(
                  'h-9 w-9 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-colors',
                  step > s.n
                    ? 'bg-brand-500 border-brand-500 text-white'
                    : step === s.n
                    ? 'border-brand-500 text-brand-600 bg-brand-50'
                    : 'border-stone-200 text-stone-400'
                )}
              >
                {step > s.n ? <Check className="h-4 w-4" /> : s.n}
              </div>
              <span className={cn('text-xs font-medium', step >= s.n ? 'text-brand-700' : 'text-stone-400')}>{s.label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn('h-0.5 flex-1 mx-2 -mt-5', step > s.n ? 'bg-brand-500' : 'bg-stone-200')} />
            )}
          </div>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 text-sm text-rose-600 bg-rose-50 rounded-control px-3 py-2 mb-4">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      <Card>
        {step === 1 && (
          <div className="text-center py-4">
            <CardTitle>Let's create your family account</CardTitle>
            <CardDescription>This sets up the family record that everything else attaches to.</CardDescription>
            <Button onClick={createFamily} size="lg" className="mt-6">
              Create family
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div>
              <Label>Parent name</Label>
              <Input value={parent.name} onChange={(e) => setParent({ ...parent, name: e.target.value })} />
            </div>
            <div>
              <Label>Parent phone</Label>
              <Input value={parent.phone} onChange={(e) => setParent({ ...parent, phone: e.target.value })} />
            </div>
            <div>
              <Label>Address</Label>
              <Input value={parent.address} onChange={(e) => setParent({ ...parent, address: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Latitude</Label>
                <Input value={parent.geoLat} onChange={(e) => setParent({ ...parent, geoLat: e.target.value })} />
              </div>
              <div>
                <Label>Longitude</Label>
                <Input value={parent.geoLng} onChange={(e) => setParent({ ...parent, geoLng: e.target.value })} />
              </div>
            </div>
            <p className="text-xs text-stone-400 -mt-2">Used to geo-verify caregiver visits against the home address.</p>
            <div>
              <Label>Health conditions (comma separated)</Label>
              <Input value={parent.conditions} onChange={(e) => setParent({ ...parent, conditions: e.target.value })} />
            </div>
            <Button onClick={addParent} size="lg" className="w-full mt-2">
              Continue
            </Button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div>
              <Label>Choose a care plan</Label>
              <Select value={tier} onChange={(e) => setTier(e.target.value)}>
                <option value="basic">Basic</option>
                <option value="standard">Standard</option>
                <option value="premium_nri">Premium (NRI)</option>
              </Select>
            </div>
            <Button onClick={choosePlan} size="lg" className="w-full mt-2">
              Finish onboarding
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
