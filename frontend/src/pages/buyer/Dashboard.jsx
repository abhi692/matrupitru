import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { api } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?.familyId) return;
    api
      .get(`/families/${user.familyId}/dashboard`)
      .then(setData)
      .catch((err) => setError(err.message));
  }, [user]);

  if (!user?.familyId) return <Navigate to="/buyer/onboarding" replace />;
  if (error) return <div className="error">{error}</div>;
  if (!data) return <div className="loading">Loading dashboard...</div>;

  const parent = data.parents[0];

  return (
    <div className="dashboard">
      <div className="dashboard-head">
        <div>
          <h2>{parent ? parent.user.name : 'Your parent'}</h2>
          <p className="muted">{parent?.address}</p>
        </div>
        <Link className="sos-link" to="/buyer/sos">View / raise SOS</Link>
      </div>

      {data.openAlerts.length > 0 && (
        <div className="card alert-card">
          <h3>Open alerts</h3>
          <ul>
            {data.openAlerts.map((a) => (
              <li key={a.id} className={`alert-${a.severity}`}>
                <strong>{a.type}</strong> — {a.severity} — {new Date(a.triggeredAt).toLocaleString()}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid-2">
        <div className="card">
          <h3>Upcoming visits</h3>
          {data.upcomingVisits.length === 0 && <p className="muted">No visits scheduled.</p>}
          <ul>
            {data.upcomingVisits.map((v) => (
              <li key={v.id}>
                {v.type} — {new Date(v.scheduledAt).toLocaleString()} — <em>{v.status}</em>
              </li>
            ))}
          </ul>
        </div>

        <div className="card">
          <h3>Recent activity — proof of care</h3>
          {data.recentVisits.length === 0 && <p className="muted">No completed visits yet.</p>}
          <ul>
            {data.recentVisits.map((v) => (
              <li key={v.id}>
                <Link to={`/buyer/visits/${v.id}`}>
                  {v.type} — {new Date(v.checkOutAt).toLocaleString()}
                  {v.geoVerified ? ' ✅ geo-verified' : ' ⚠️ not geo-verified'}
                  {' — '}
                  {v.proofs.length} proof artifact(s)
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="card">
        <h3>Vitals trend (latest readings)</h3>
        {data.vitals.length === 0 && <p className="muted">No vitals recorded yet.</p>}
        <table>
          <thead>
            <tr><th>Type</th><th>Value</th><th>Recorded</th><th>Flagged</th></tr>
          </thead>
          <tbody>
            {data.vitals.map((v) => (
              <tr key={v.id} className={v.flagged ? 'flagged-row' : ''}>
                <td>{v.type}</td>
                <td>{v.value} {v.unit}</td>
                <td>{new Date(v.recordedAt).toLocaleString()}</td>
                <td>{v.flagged ? 'Yes' : 'No'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>Care plan</h3>
        <p>Tier: <strong>{data.carePlan?.tier}</strong></p>
        <Link to="/buyer/billing">Manage billing / subscription</Link>
        {' · '}
        <Link to="/buyer/book">Book a service</Link>
      </div>
    </div>
  );
}
