import { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Card, CardTitle, CardDescription, Badge, Button, Input, ErrorBox } from '../../components/ui';
import { colors } from '../../theme';

const STATUS_BADGE = { verified: 'success', pending: 'warning', rejected: 'danger' };

export default function AdminConsoleScreen() {
  const { logout } = useAuth();
  const [caregivers, setCaregivers] = useState([]);
  const [sla, setSla] = useState(null);
  const [audit, setAudit] = useState([]);
  const [cityDraft, setCityDraft] = useState({});
  const [error, setError] = useState('');

  function refresh() {
    api.get('/admin/caregivers').then(setCaregivers).catch((e) => setError(e.message));
    api.get('/admin/sla').then(setSla).catch((e) => setError(e.message));
    api.get('/admin/audit').then(setAudit).catch((e) => setError(e.message));
  }

  useEffect(refresh, []);

  async function setVerification(id, status) {
    await api.patch(`/admin/caregivers/${id}/verification`, { status });
    refresh();
  }

  async function saveCoverage(id) {
    const cities = (cityDraft[id] ?? '').split(',').map((c) => c.trim()).filter(Boolean);
    await api.patch(`/admin/caregivers/${id}/coverage`, { cities });
    refresh();
  }

  return (
    <ScrollView contentContainerStyle={s.content}>
      <View style={s.headRow}>
        <Text style={s.title}>Admin</Text>
        <Text onPress={logout} style={s.logout}>Log out</Text>
      </View>
      <ErrorBox>{error}</ErrorBox>

      <Card>
        <CardTitle>SLA & success metrics</CardTitle>
        {sla && (
          <View style={s.metricsGrid}>
            <Metric label="Geo-verified rate" value={sla.geoVerifiedRate != null ? `${sla.geoVerifiedRate}%` : '—'} />
            <Metric label="Missed-visit rate" value={sla.missedVisitRate != null ? `${sla.missedVisitRate}%` : '—'} warn={sla.missedVisitRate > 10} />
            <Metric label="Avg SOS ack" value={sla.avgSosAckSeconds != null ? `${sla.avgSosAckSeconds}s` : '—'} warn={sla.avgSosAckSeconds > 60} />
            <Metric label="Total visits" value={sla.totalVisits} />
            <Metric label="Families" value={sla.totalFamilies} />
            <Metric label="Active (30d)" value={sla.activeParents30d} />
          </View>
        )}
      </Card>

      <Card>
        <CardTitle>Caregiver verification & coverage</CardTitle>
        {caregivers.map((c) => (
          <View key={c.id} style={s.caregiverBlock}>
            <View style={s.headRow}>
              <Text style={s.caregiverName}>{c.user.name}</Text>
              <Badge variant={STATUS_BADGE[c.verificationStatus]}>{c.verificationStatus}</Badge>
            </View>
            <View style={s.btnRow}>
              <Button variant="subtle" onPress={() => setVerification(c.id, 'verified')}>Verify</Button>
              <Button variant="outline" onPress={() => setVerification(c.id, 'pending')}>Pending</Button>
              <Button variant="outline" onPress={() => setVerification(c.id, 'rejected')}>Reject</Button>
            </View>
            <View style={s.coverageRow}>
              <Input
                style={{ flex: 1 }}
                defaultValue={JSON.parse(c.serviceCitiesJson || '[]').join(', ')}
                onChangeText={(v) => setCityDraft({ ...cityDraft, [c.id]: v })}
                placeholder="Cities, comma separated"
              />
              <Button onPress={() => saveCoverage(c.id)}>Save</Button>
            </View>
          </View>
        ))}
      </Card>

      <Card>
        <CardTitle>Audit log</CardTitle>
        <CardDescription>Recent domain events</CardDescription>
        {audit.slice(0, 15).map((e) => (
          <View key={e.id} style={s.auditRow}>
            <Text style={s.auditType}>{e.type}</Text>
            <Text style={s.muted}>{new Date(e.createdAt).toLocaleTimeString()}</Text>
          </View>
        ))}
      </Card>
    </ScrollView>
  );
}

function Metric({ label, value, warn }) {
  return (
    <View style={[s.metric, warn && { borderColor: colors.warm200, backgroundColor: colors.warm50 }]}>
      <Text style={[s.metricValue, warn && { color: colors.warm600 }]}>{value}</Text>
      <Text style={s.metricLabel}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  content: { padding: 18, paddingTop: 54, paddingBottom: 40 },
  headRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  title: { fontSize: 22, fontWeight: '800', color: colors.brand700 },
  logout: { color: colors.stone500, fontSize: 13 },
  muted: { color: colors.stone400, fontSize: 12 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metric: { width: '31%', borderWidth: 1, borderColor: colors.stone100, borderRadius: 12, padding: 10 },
  metricValue: { fontSize: 18, fontWeight: '800', color: colors.brand700 },
  metricLabel: { fontSize: 10, color: colors.stone500, marginTop: 2 },
  caregiverBlock: { borderTopWidth: 1, borderTopColor: colors.stone100, paddingVertical: 12 },
  caregiverName: { fontWeight: '700', color: colors.stone800, fontSize: 15 },
  btnRow: { flexDirection: 'row', gap: 6, marginTop: 8 },
  coverageRow: { flexDirection: 'row', gap: 8, marginTop: 8, alignItems: 'center' },
  auditRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderTopWidth: 1, borderTopColor: colors.stone100 },
  auditType: { fontSize: 13, color: colors.stone700, fontWeight: '600' },
});
