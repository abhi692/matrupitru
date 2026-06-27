import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Card, CardTitle, CardDescription, Button, Input, Label, ErrorBox } from '../../components/ui';
import Select from '../../components/Select';
import { colors, radius } from '../../theme';

const STEPS = ['Consent', 'Parent basics', 'Health profile', 'Emergency contact', 'Care plan'];

const MOBILITY_OPTIONS = [
  { value: 'independent', label: 'Independent' },
  { value: 'limited', label: 'Limited' },
  { value: 'bedridden', label: 'Bedridden' },
];
const TECH_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];
const TIER_OPTIONS = [
  { value: 'basic', label: 'Basic' },
  { value: 'standard', label: 'Standard' },
  { value: 'premium_nri', label: 'Premium (NRI)' },
];

function csv(s) {
  return s ? s.split(',').map((c) => c.trim()).filter(Boolean) : [];
}

// Mirrors the web's 5-step onboarding (frontend/src/pages/buyer/Onboarding.jsx)
// so a buyer can set up their parent's profile from the app instead of having
// to switch to the website first.
export default function OnboardingScreen({ navigation }) {
  const { setUser } = useAuth();
  const [step, setStep] = useState(1);
  const [familyId, setFamilyId] = useState(null);
  const [consent, setConsent] = useState(false);
  const [parent, setParent] = useState({
    name: '', phone: '', address: '', city: '', geoLat: '', geoLng: '',
    languages: 'en', mobilityLevel: 'independent', techComfort: 'low',
    conditions: '', allergies: '', medications: '', preferredHospital: '',
  });
  const [contact, setContact] = useState({ name: '', phone: '', relation: '' });
  const [tier, setTier] = useState('standard');
  const [error, setError] = useState('');
  const [locating, setLocating] = useState(false);

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

  async function useCurrentLocation() {
    setError('');
    setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission denied.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      setParent((p) => ({ ...p, geoLat: String(pos.coords.latitude), geoLng: String(pos.coords.longitude) }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLocating(false);
    }
  }

  async function addParent() {
    setError('');
    try {
      await api.post(`/families/${familyId}/parents`, {
        name: parent.name,
        phone: parent.phone,
        address: parent.address,
        city: parent.city,
        geoLat: parent.geoLat ? Number(parent.geoLat) : undefined,
        geoLng: parent.geoLng ? Number(parent.geoLng) : undefined,
        languages: csv(parent.languages),
        mobilityLevel: parent.mobilityLevel,
        techComfort: parent.techComfort,
        conditions: csv(parent.conditions),
        allergies: csv(parent.allergies),
        medications: csv(parent.medications),
        preferredHospital: parent.preferredHospital,
        emergencyContacts: contact.name ? [contact] : [],
        locale: csv(parent.languages)[0] || 'en',
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
      navigation.replace('Dashboard');
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <ScrollView contentContainerStyle={s.content}>
      <Text style={s.title}>Onboard your parent</Text>
      <Text style={s.subtitle}>A few quick steps and you're set up.</Text>

      <View style={s.stepRow}>
        {STEPS.map((label, i) => (
          <View key={label} style={s.stepDotWrap}>
            <View style={[s.stepDot, step > i + 1 && s.stepDotDone, step === i + 1 && s.stepDotActive]}>
              {step > i + 1 ? <Ionicons name="checkmark" size={12} color="#fff" /> : <Text style={s.stepDotText}>{i + 1}</Text>}
            </View>
          </View>
        ))}
      </View>
      <Text style={s.stepLabel}>{STEPS[step - 1]}</Text>

      <ErrorBox>{error}</ErrorBox>

      <Card>
        {step === 1 && (
          <View>
            <CardTitle>Data &amp; privacy consent</CardTitle>
            <CardDescription>
              MatruPitru handles your parent's health and location data as sensitive information
              (DPDP Act 2023). We use it only to coordinate care — verify visits, alert you to
              issues, and provide proof of care. You can request deletion at any time.
            </CardDescription>
            <TouchableOpacity style={s.consentRow} onPress={() => setConsent(!consent)} activeOpacity={0.7}>
              <Ionicons name={consent ? 'checkbox' : 'square-outline'} size={22} color={consent ? colors.accent : colors.textTertiary} />
              <Text style={s.consentText}>
                I consent to MatruPitru collecting and processing my family's health, location, and
                contact data for the purpose of elder care coordination.
              </Text>
            </TouchableOpacity>
            <Button onPress={createFamily} disabled={!consent} style={{ marginTop: 16 }}>Accept &amp; create family</Button>
          </View>
        )}

        {step === 2 && (
          <View>
            <Label>Parent name</Label>
            <Input value={parent.name} onChangeText={(v) => setParent({ ...parent, name: v })} />
            <Label>Parent phone</Label>
            <Input value={parent.phone} onChangeText={(v) => setParent({ ...parent, phone: v })} keyboardType="phone-pad" />
            <Label>Address</Label>
            <Input value={parent.address} onChangeText={(v) => setParent({ ...parent, address: v })} />
            <Label>City</Label>
            <Input value={parent.city} onChangeText={(v) => setParent({ ...parent, city: v })} placeholder="Hubli" />
            <Button variant="outline" icon="locate-outline" onPress={useCurrentLocation} loading={locating} style={{ marginTop: 12 }}>
              Use my current location
            </Button>
            {parent.geoLat ? <Text style={s.geoHint}>Lat {Number(parent.geoLat).toFixed(5)}, Lng {Number(parent.geoLng).toFixed(5)}</Text> : null}
            <Text style={s.helper}>Used to geo-verify caregiver visits against the home address.</Text>
            <Button
              onPress={() => setStep(3)}
              disabled={!parent.name || !parent.phone || !parent.address}
              style={{ marginTop: 8 }}
            >
              Continue
            </Button>
          </View>
        )}

        {step === 3 && (
          <View>
            <Label>Languages spoken (comma separated)</Label>
            <Input value={parent.languages} onChangeText={(v) => setParent({ ...parent, languages: v })} placeholder="kn, en" />
            <Label>Preferred hospital</Label>
            <Input value={parent.preferredHospital} onChangeText={(v) => setParent({ ...parent, preferredHospital: v })} />
            <Label>Mobility level</Label>
            <Select value={parent.mobilityLevel} onValueChange={(v) => setParent({ ...parent, mobilityLevel: v })} items={MOBILITY_OPTIONS} />
            <Label>Tech comfort</Label>
            <Select value={parent.techComfort} onValueChange={(v) => setParent({ ...parent, techComfort: v })} items={TECH_OPTIONS} />
            <Label>Health conditions (comma separated)</Label>
            <Input value={parent.conditions} onChangeText={(v) => setParent({ ...parent, conditions: v })} placeholder="hypertension, diabetes" />
            <Label>Allergies (comma separated)</Label>
            <Input value={parent.allergies} onChangeText={(v) => setParent({ ...parent, allergies: v })} placeholder="penicillin" />
            <Label>Current medications (comma separated)</Label>
            <Input value={parent.medications} onChangeText={(v) => setParent({ ...parent, medications: v })} placeholder="Amlodipine 5mg - once daily" />
            <Button onPress={() => setStep(4)} style={{ marginTop: 8 }}>Continue</Button>
          </View>
        )}

        {step === 4 && (
          <View>
            <CardDescription>Who should be contacted in an emergency, besides you?</CardDescription>
            <Label>Contact name</Label>
            <Input value={contact.name} onChangeText={(v) => setContact({ ...contact, name: v })} />
            <Label>Phone</Label>
            <Input value={contact.phone} onChangeText={(v) => setContact({ ...contact, phone: v })} keyboardType="phone-pad" />
            <Label>Relation</Label>
            <Input value={contact.relation} onChangeText={(v) => setContact({ ...contact, relation: v })} placeholder="son, neighbor..." />
            <Button onPress={addParent} style={{ marginTop: 8 }}>Save parent profile</Button>
          </View>
        )}

        {step === 5 && (
          <View>
            <Label>Choose a care plan</Label>
            <Select value={tier} onValueChange={setTier} items={TIER_OPTIONS} />
            <Button onPress={choosePlan} style={{ marginTop: 8 }}>Finish onboarding</Button>
          </View>
        )}
      </Card>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  content: { padding: 18, paddingTop: 60, paddingBottom: 40 },
  title: { fontSize: 24, fontWeight: '800', color: colors.textPrimary },
  subtitle: { fontSize: 13, color: colors.textTertiary, marginTop: 2, marginBottom: 16 },
  stepRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6, paddingHorizontal: 4 },
  stepDotWrap: { flex: 1, alignItems: 'center' },
  stepDot: { width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: colors.separator, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  stepDotActive: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  stepDotDone: { borderColor: colors.accent, backgroundColor: colors.accent },
  stepDotText: { fontSize: 11, fontWeight: '700', color: colors.textTertiary },
  stepLabel: { textAlign: 'center', fontSize: 13, fontWeight: '700', color: colors.accentDark, marginBottom: 16 },
  consentRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, backgroundColor: colors.surfaceAlt, borderRadius: radius.control, padding: 13, marginTop: 8 },
  consentText: { flex: 1, fontSize: 13, color: colors.textSecondary, lineHeight: 18 },
  geoHint: { fontSize: 12, color: colors.accentDark, marginTop: 6 },
  helper: { fontSize: 12, color: colors.textTertiary, marginTop: 6, marginBottom: 4 },
});
