import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, AlertCircle, UserPlus, MapPin, HeartPulse, Phone, ShieldCheck } from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { Card, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input, Label } from '../../components/ui/Input';
import { PhoneInput, isValidIndianPhone } from '../../components/ui/PhoneInput';
import { Select } from '../../components/ui/Select';
import { cn } from '../../lib/utils';

const STEPS = [
  { n: 1, label: 'Consent', icon: ShieldCheck },
  { n: 2, label: 'Parent basics', icon: MapPin },
  { n: 3, label: 'Health profile', icon: HeartPulse },
  { n: 4, label: 'Emergency contact', icon: Phone },
  { n: 5, label: 'Care plan', icon: UserPlus },
];

const EMPTY_CONTACT = { name: '', phone: '', relation: '' };

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const [familyId, setFamilyId] = useState(null);
  const [consent, setConsent] = useState(false);
  const [parent, setParent] = useState({
    name: '', phone: '', password: '', confirmPassword: '', address: '', city: '', geoLat: '', geoLng: '',
    languages: 'en', mobilityLevel: 'independent', techComfort: 'low',
    conditions: '', allergies: '', medications: '', preferredHospital: '',
  });
  const [contact, setContact] = useState(EMPTY_CONTACT);
  const [tier, setTier] = useState('standard');
  const [error, setError] = useState('');
  const { setUser } = useAuth();
  const navigate = useNavigate();

  async function createFamily() {
    setError('');
    if (!consent) return setError('Please accept the consent terms to continue.');
    try {
      const family = await api.post('/families', { billingCurrency: 'USD', consent: true });
      setFamilyId(family.id);
      setUser((u) => ({ ...u, familyId: family.id }));
      setStep(2);
    } catch (err) {
      setError(err.message);
    }
  }

  async function addParent() {
    setError('');
    if (parent.password.length < 8) {
      return setError('Password must be at least 8 characters.');
    }
    if (parent.password !== parent.confirmPassword) {
      return setError('Passwords do not match.');
    }
    try {
      await api.post(`/families/${familyId}/parents`, {
        name: parent.name,
        phone: parent.phone,
        password: parent.password,
        address: parent.address,
        city: parent.city,
        geoLat: parent.geoLat ? Number(parent.geoLat) : undefined,
        geoLng: parent.geoLng ? Number(parent.geoLng) : undefined,
        languages: parent.languages.split(',').map((l) => l.trim()).filter(Boolean),
        mobilityLevel: parent.mobilityLevel,
        techComfort: parent.techComfort,
        conditions: csv(parent.conditions),
        allergies: csv(parent.allergies),
        medications: csv(parent.medications),
        preferredHospital: parent.preferredHospital,
        emergencyContacts: contact.name ? [contact] : [],
        locale: parent.languages.split(',')[0]?.trim() || 'en',
      });
      setStep(5);
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

  function csv(s) {
    return s ? s.split(',').map((c) => c.trim()).filter(Boolean) : [];
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
                  'h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-colors shrink-0',
                  step > s.n
                    ? 'bg-brand-500 border-brand-500 text-white'
                    : step === s.n
                    ? 'border-brand-500 text-brand-600 bg-brand-50'
                    : 'border-stone-200 text-stone-400'
                )}
              >
                {step > s.n ? <Check className="h-3.5 w-3.5" /> : s.n}
              </div>
              <span className={cn('text-[11px] font-medium text-center', step >= s.n ? 'text-brand-700' : 'text-stone-400')}>
                {s.label}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={cn('h-0.5 flex-1 mx-1.5 -mt-5', step > s.n ? 'bg-brand-500' : 'bg-stone-200')} />
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
          <div>
            <CardTitle>Data &amp; privacy consent</CardTitle>
            <CardDescription className="mb-4">
              MatruPitru handles your parent's health and location data as sensitive information
              (DPDP Act 2023). We use it only to coordinate care — verify visits, alert you to
              issues, and provide proof of care. You can request deletion at any time.
            </CardDescription>
            <label className="flex items-start gap-3 text-sm text-stone-600 bg-stone-50 rounded-control p-3 cursor-pointer">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-0.5 h-4 w-4 accent-brand-500"
              />
              I consent to MatruPitru collecting and processing my family's health, location, and
              contact data for the purpose of elder care coordination.
            </label>
            <Button onClick={createFamily} size="lg" className="w-full mt-6" disabled={!consent}>
              Accept &amp; create family
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
              <PhoneInput value={parent.phone} onChange={(v) => setParent({ ...parent, phone: v })} />
            </div>
            <div>
              <Label>Set a password for your parent's account</Label>
              <Input type="password" value={parent.password} onChange={(e) => setParent({ ...parent, password: e.target.value })} placeholder="At least 8 characters" />
            </div>
            <div>
              <Label>Confirm password</Label>
              <Input type="password" value={parent.confirmPassword} onChange={(e) => setParent({ ...parent, confirmPassword: e.target.value })} />
            </div>
            <p className="text-xs text-stone-400 -mt-2">
              Your parent can log in with this phone + password, or with a one-time code sent to
              their phone — they don't have to remember the password if OTP is easier for them.
            </p>
            <div>
              <Label>Address</Label>
              <Input value={parent.address} onChange={(e) => setParent({ ...parent, address: e.target.value })} />
            </div>
            <div>
              <Label>City</Label>
              <Input value={parent.city} onChange={(e) => setParent({ ...parent, city: e.target.value })} placeholder="Hubli" />
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
            <p className="text-xs text-stone-400 -mt-2">Lat/lng is used to geo-verify caregiver visits against the home address.</p>
            <Button
              onClick={() => setStep(3)}
              size="lg"
              className="w-full mt-2"
              disabled={!parent.name || !isValidIndianPhone(parent.phone) || !parent.address || parent.password.length < 8 || parent.password !== parent.confirmPassword}
            >
              Continue
            </Button>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Languages spoken</Label>
                <Input value={parent.languages} onChange={(e) => setParent({ ...parent, languages: e.target.value })} placeholder="kn, en" />
              </div>
              <div>
                <Label>Preferred hospital</Label>
                <Input value={parent.preferredHospital} onChange={(e) => setParent({ ...parent, preferredHospital: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Mobility level</Label>
                <Select value={parent.mobilityLevel} onChange={(e) => setParent({ ...parent, mobilityLevel: e.target.value })}>
                  <option value="independent">Independent</option>
                  <option value="limited">Limited</option>
                  <option value="bedridden">Bedridden</option>
                </Select>
              </div>
              <div>
                <Label>Tech comfort</Label>
                <Select value={parent.techComfort} onChange={(e) => setParent({ ...parent, techComfort: e.target.value })}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </Select>
              </div>
            </div>
            <div>
              <Label>Health conditions (comma separated)</Label>
              <Input value={parent.conditions} onChange={(e) => setParent({ ...parent, conditions: e.target.value })} placeholder="hypertension, diabetes" />
            </div>
            <div>
              <Label>Allergies (comma separated)</Label>
              <Input value={parent.allergies} onChange={(e) => setParent({ ...parent, allergies: e.target.value })} placeholder="penicillin" />
            </div>
            <div>
              <Label>Current medications (comma separated)</Label>
              <Input value={parent.medications} onChange={(e) => setParent({ ...parent, medications: e.target.value })} placeholder="Amlodipine 5mg - once daily" />
            </div>
            <Button onClick={() => setStep(4)} size="lg" className="w-full mt-2">
              Continue
            </Button>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <CardDescription className="mb-0">Who should be contacted in an emergency, besides you?</CardDescription>
            <div>
              <Label>Contact name</Label>
              <Input value={contact.name} onChange={(e) => setContact({ ...contact, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Phone</Label>
                <PhoneInput value={contact.phone} onChange={(v) => setContact({ ...contact, phone: v })} />
              </div>
              <div>
                <Label>Relation</Label>
                <Input value={contact.relation} onChange={(e) => setContact({ ...contact, relation: e.target.value })} placeholder="son, neighbor..." />
              </div>
            </div>
            <Button onClick={addParent} size="lg" className="w-full mt-2">
              Save parent profile
            </Button>
          </div>
        )}

        {step === 5 && (
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
