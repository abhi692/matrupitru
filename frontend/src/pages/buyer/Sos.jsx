import { useEffect, useState } from 'react';
import { Siren, AlertCircle, CheckCircle2 } from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { Card, CardTitle, CardDescription } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

const SEVERITY_VARIANT = { emergency: 'danger', critical: 'danger', warning: 'warning', info: 'neutral' };

// §6.2: SOS must reach a human in <60s. This view mirrors the buyer-side
// visibility into that path — raising it, and watching it get acknowledged.
export default function Sos() {
  const { user } = useAuth();
  const [parentId, setParentId] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [error, setError] = useState('');
  const [sosResult, setSosResult] = useState(null);

  useEffect(() => {
    if (!user?.familyId) return;
    api.get(`/families/${user.familyId}/dashboard`).then((d) => {
      setParentId(d.parents[0]?.id);
    });
    refreshAlerts();
  }, [user]);

  function refreshAlerts() {
    if (!user?.familyId) return;
    api.get(`/alerts?family=${user.familyId}`).then(setAlerts).catch((e) => setError(e.message));
  }

  async function raiseSos() {
    if (!parentId) return;
    setError('');
    try {
      const result = await api.post(`/parents/${parentId}/sos`, {});
      setSosResult(result);
      refreshAlerts();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="max-w-xl mx-auto space-y-6">
      <Card className="border-rose-100">
        <CardTitle className="flex items-center gap-2 text-rose-700">
          <Siren className="h-5 w-5" /> Emergency (SOS)
        </CardTitle>
        <CardDescription>
          Raising this simulates the parent tapping SOS — it notifies the Care Manager and you,
          across channels (push + SMS + WhatsApp), and degrades to a phone call if needed.
        </CardDescription>

        <Button variant="emergency" size="xl" className="w-full mt-5" onClick={raiseSos}>
          <Siren className="h-5 w-5" /> Raise SOS now
        </Button>

        {error && (
          <div className="flex items-center gap-2 text-sm text-rose-600 bg-rose-50 rounded-control px-3 py-2 mt-4">
            <AlertCircle className="h-4 w-4 shrink-0" /> {error}
          </div>
        )}
        {sosResult && (
          <div className="flex items-start gap-2 text-sm text-brand-700 bg-brand-50 rounded-control px-3 py-2.5 mt-4">
            <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
            <span>
              Alert raised. Care Manager notified: {sosResult.notified.careManager ? 'yes' : 'no'}.{' '}
              Buyers notified: {sosResult.notified.buyers}.
            </span>
          </div>
        )}
      </Card>

      <Card>
        <CardTitle>Alert history</CardTitle>
        {alerts.length === 0 ? (
          <p className="text-stone-400 text-sm mt-2">No alerts yet.</p>
        ) : (
          <ul className="space-y-2 mt-3">
            {alerts.map((a) => (
              <li key={a.id} className="flex items-center justify-between text-sm border border-stone-100 rounded-control px-3 py-2.5">
                <span className="font-medium text-stone-700 capitalize">{a.type.replace(/_/g, ' ')}</span>
                <div className="flex items-center gap-2 text-right">
                  <Badge variant={SEVERITY_VARIANT[a.severity] || 'neutral'} className="capitalize">{a.severity}</Badge>
                  <span className="text-stone-400 text-xs">
                    {a.acknowledgedAt ? `Acknowledged ${new Date(a.acknowledgedAt).toLocaleTimeString()}` : 'Pending'}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
