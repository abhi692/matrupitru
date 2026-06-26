import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { MapPin, ShieldAlert, CheckCircle2, AlertTriangle, CalendarClock, Activity, CreditCard, Stethoscope, Pill, Sparkles, Loader2, Users, UserPlus, Video, History } from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { Card, CardHeader, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';

const SEVERITY_VARIANT = { emergency: 'danger', critical: 'danger', warning: 'warning', info: 'neutral' };

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [meds, setMeds] = useState([]);
  const [error, setError] = useState('');
  const [digest, setDigest] = useState(null);
  const [digestError, setDigestError] = useState('');
  const [digestLoading, setDigestLoading] = useState(false);
  const [invitePhone, setInvitePhone] = useState('');
  const [inviteStatus, setInviteStatus] = useState('');
  const [invites, setInvites] = useState([]);
  const [videoStatus, setVideoStatus] = useState('');
  const [videoLoading, setVideoLoading] = useState(false);

  async function startVideoCall() {
    setVideoStatus('');
    setVideoLoading(true);
    try {
      const session = await api.post(`/families/${user.familyId}/video-sessions`, {});
      window.open(session.roomUrl, '_blank', 'noopener');
    } catch (err) {
      setVideoStatus(err.message);
    } finally {
      setVideoLoading(false);
    }
  }

  function loadInvites() {
    if (user?.familyId) api.get(`/families/${user.familyId}/invites`).then(setInvites).catch(() => {});
  }

  useEffect(() => {
    if (!user?.familyId) return;
    api
      .get(`/families/${user.familyId}/dashboard`)
      .then((d) => {
        setData(d);
        const parentId = d.parents[0]?.id;
        if (parentId) api.get(`/parents/${parentId}/medications`).then(setMeds);
      })
      .catch((err) => setError(err.message));
    loadInvites();
  }, [user]);

  async function sendInvite(e) {
    e.preventDefault();
    setInviteStatus('');
    try {
      await api.post(`/families/${user.familyId}/invites`, { phone: invitePhone });
      setInviteStatus(`Invite sent to ${invitePhone}. They'll join automatically when they register or log in.`);
      setInvitePhone('');
      loadInvites();
    } catch (err) {
      setInviteStatus(err.message);
    }
  }

  if (!user?.familyId) return <Navigate to="/buyer/onboarding" replace />;
  if (error) return <p className="text-rose-600 bg-rose-50 rounded-control px-4 py-3">{error}</p>;
  if (!data) return <p className="text-stone-400 text-center py-12">Loading dashboard...</p>;

  const parent = data.parents[0];

  async function generateDigest() {
    setDigestLoading(true);
    setDigestError('');
    setDigest(null);
    try {
      const result = await api.post(`/families/${user.familyId}/digest`, {});
      setDigest(result);
    } catch (err) {
      setDigestError(err.message);
    } finally {
      setDigestLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-stone-900">{parent ? parent.user.name : 'Your parent'}</h2>
          {parent?.address && (
            <p className="text-stone-500 text-sm mt-1 flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" /> {parent.address}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Link to="/buyer/timeline">
            <Button variant="outline"><History className="h-4 w-4" /> Timeline</Button>
          </Link>
          <Button variant="subtle" onClick={startVideoCall} disabled={videoLoading}>
            {videoLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />} Video call
          </Button>
          <Link to="/buyer/sos">
            <Button variant="emergency">
              <ShieldAlert className="h-4 w-4" /> View / raise SOS
            </Button>
          </Link>
        </div>
      </div>
      {videoStatus && <p className="text-sm text-stone-500">{videoStatus}</p>}

      {data.openAlerts.length > 0 && (
        <Card className="border-warm-200 bg-warm-50/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warm-600">
              <AlertTriangle className="h-5 w-5" /> Open alerts
            </CardTitle>
          </CardHeader>
          <ul className="space-y-2">
            {data.openAlerts.map((a) => (
              <li key={a.id} className="flex items-center justify-between text-sm bg-white rounded-control px-3 py-2 border border-stone-100">
                <span className="font-medium text-stone-700 capitalize">{a.type.replace(/_/g, ' ')}</span>
                <div className="flex items-center gap-2">
                  <Badge variant={SEVERITY_VARIANT[a.severity] || 'neutral'} className="capitalize">{a.severity}</Badge>
                  <span className="text-stone-400 text-xs">{new Date(a.triggeredAt).toLocaleString()}</span>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card className="border-brand-100 bg-brand-50/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-brand-700"><Sparkles className="h-5 w-5" /> AI family update</CardTitle>
        </CardHeader>
        {!digest && (
          <Button variant="subtle" onClick={generateDigest} disabled={digestLoading}>
            {digestLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
            {digestLoading ? 'Generating...' : 'Generate this week\'s update'}
          </Button>
        )}
        {digestError && <p className="text-sm text-stone-500 mt-3">{digestError}</p>}
        {digest && (
          <div>
            <p className="text-stone-700 leading-relaxed">{digest.digest}</p>
            <Button variant="ghost" size="sm" className="mt-3" onClick={generateDigest}>
              <Sparkles className="h-3.5 w-3.5" /> Regenerate
            </Button>
          </div>
        )}
      </Card>

      <div className="grid sm:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CalendarClock className="h-5 w-5 text-brand-500" /> Upcoming visits</CardTitle>
          </CardHeader>
          {data.upcomingVisits.length === 0 ? (
            <p className="text-stone-400 text-sm">No visits scheduled.</p>
          ) : (
            <ul className="space-y-2">
              {data.upcomingVisits.map((v) => (
                <li key={v.id} className="flex items-center justify-between text-sm border border-stone-100 rounded-control px-3 py-2.5">
                  <span className="font-medium text-stone-700 capitalize">{v.type}</span>
                  <span className="text-stone-400 text-xs text-right">
                    {new Date(v.scheduledAt).toLocaleString()}
                    <br />
                    <span className="capitalize text-brand-600">{v.status}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-brand-500" /> Recent activity — proof of care</CardTitle>
          </CardHeader>
          {data.recentVisits.length === 0 ? (
            <p className="text-stone-400 text-sm">No completed visits yet.</p>
          ) : (
            <ul className="space-y-2">
              {data.recentVisits.map((v) => (
                <li key={v.id}>
                  <Link
                    to={`/buyer/visits/${v.id}`}
                    className="flex items-center justify-between text-sm border border-stone-100 rounded-control px-3 py-2.5 hover:border-brand-300 hover:bg-brand-50/40 transition-colors"
                  >
                    <span>
                      <span className="font-medium text-stone-700 capitalize">{v.type}</span>
                      <br />
                      <span className="text-stone-400 text-xs">{new Date(v.checkOutAt).toLocaleString()}</span>
                    </span>
                    <span className="text-right text-xs">
                      <Badge variant={v.geoVerified ? 'success' : 'warning'}>
                        {v.geoVerified ? 'Geo-verified' : 'Not verified'}
                      </Badge>
                      <br />
                      <span className="text-stone-400 mt-1 inline-block">{v.proofs.length} proof artifact(s)</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Activity className="h-5 w-5 text-brand-500" /> Vitals trend (latest readings)</CardTitle>
        </CardHeader>
        {data.vitals.length === 0 ? (
          <p className="text-stone-400 text-sm">No vitals recorded yet.</p>
        ) : (
          <div className="overflow-x-auto -mx-2">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-stone-400 text-xs uppercase tracking-wide">
                  <th className="px-2 py-2 font-medium">Type</th>
                  <th className="px-2 py-2 font-medium">Value</th>
                  <th className="px-2 py-2 font-medium">Recorded</th>
                  <th className="px-2 py-2 font-medium">Flagged</th>
                </tr>
              </thead>
              <tbody>
                {data.vitals.map((v) => (
                  <tr key={v.id} className={v.flagged ? 'bg-warm-50/60' : ''}>
                    <td className="px-2 py-2.5 capitalize font-medium text-stone-700 border-t border-stone-100">{v.type}</td>
                    <td className="px-2 py-2.5 border-t border-stone-100">{v.value} {v.unit}</td>
                    <td className="px-2 py-2.5 text-stone-500 border-t border-stone-100">{new Date(v.recordedAt).toLocaleString()}</td>
                    <td className="px-2 py-2.5 border-t border-stone-100">
                      {v.flagged ? <Badge variant="warning">Flagged</Badge> : <span className="text-stone-400">No</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {meds.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Pill className="h-5 w-5 text-brand-500" /> Medication adherence</CardTitle>
          </CardHeader>
          <ul className="space-y-2">
            {meds.slice(0, 8).map((m) => (
              <li key={m.id} className="flex items-center justify-between text-sm border border-stone-100 rounded-control px-3 py-2.5">
                <span className="font-medium text-stone-700">{m.medication}</span>
                <span className="text-right text-xs">
                  <Badge variant={m.status === 'given' ? 'success' : m.status === 'missed' ? 'danger' : m.status === 'due' ? 'warning' : 'neutral'} className="capitalize">
                    {m.status}
                  </Badge>
                  <br />
                  <span className="text-stone-400">{new Date(m.scheduledAt).toLocaleString()}</span>
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-brand-500" /> Family sharing</CardTitle>
        </CardHeader>
        <p className="text-sm text-stone-500 mb-3">
          Invite a sibling so they see the same dashboard, alerts and visit history — no need to relay updates manually.
        </p>
        {data.buyers?.length > 0 && (
          <ul className="flex flex-wrap gap-2 mb-3">
            {data.buyers.map((b) => (
              <li key={b.id}>
                <Badge variant="neutral">{b.name}{b.id === user.id ? ' (you)' : ''}</Badge>
              </li>
            ))}
          </ul>
        )}
        {invites.filter((i) => i.status === 'pending').length > 0 && (
          <ul className="flex flex-wrap gap-2 mb-3">
            {invites.filter((i) => i.status === 'pending').map((i) => (
              <li key={i.id}><Badge variant="warning">Invited: {i.phone}</Badge></li>
            ))}
          </ul>
        )}
        <form onSubmit={sendInvite} className="flex gap-2">
          <input
            type="tel"
            required
            value={invitePhone}
            onChange={(e) => setInvitePhone(e.target.value)}
            placeholder="Sibling's phone number (e.g. +919900000000)"
            className="flex-1 rounded-control border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
          />
          <Button type="submit" variant="subtle" size="sm"><UserPlus className="h-3.5 w-3.5" /> Invite</Button>
        </form>
        {inviteStatus && <p className="text-sm text-stone-500 mt-2">{inviteStatus}</p>}
      </Card>

      <Card className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2"><Stethoscope className="h-5 w-5 text-brand-500" /> Care plan</CardTitle>
          <p className="text-sm text-stone-500 mt-1">
            Tier: <span className="font-semibold text-stone-700 capitalize">{data.carePlan?.tier?.replace(/_/g, ' ')}</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/buyer/billing"><Button variant="outline" size="sm"><CreditCard className="h-3.5 w-3.5" /> Billing</Button></Link>
          <Link to="/buyer/book"><Button variant="subtle" size="sm">Book a service</Button></Link>
        </div>
      </Card>
    </div>
  );
}
