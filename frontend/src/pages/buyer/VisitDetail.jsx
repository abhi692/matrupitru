import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../../api/client';

export default function VisitDetail() {
  const { id } = useParams();
  const [visit, setVisit] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/visits/${id}`).then(setVisit).catch((e) => setError(e.message));
  }, [id]);

  if (error) return <div className="error">{error}</div>;
  if (!visit) return <div className="loading">Loading visit...</div>;

  const checklist = JSON.parse(visit.taskChecklistJson || '[]');

  return (
    <div className="card">
      <Link to="/buyer">← Back to dashboard</Link>
      <h2>Visit — {visit.type}</h2>
      <p>Caregiver: {visit.caregiver?.name || 'Unassigned'}</p>
      <p>Status: <strong>{visit.status}</strong></p>
      <p>
        Geo-verified:{' '}
        <strong className={visit.geoVerified ? 'ok-text' : 'warn-text'}>
          {visit.geoVerified ? 'Yes — caregiver confirmed at home address' : 'No — flagged for ops review'}
        </strong>
      </p>
      <p>Check-in: {visit.checkInAt ? new Date(visit.checkInAt).toLocaleString() : '—'}</p>
      <p>Check-out: {visit.checkOutAt ? new Date(visit.checkOutAt).toLocaleString() : '—'}</p>
      <p>Parent confirmed: {visit.parentConfirmedAt ? new Date(visit.parentConfirmedAt).toLocaleString() : 'Not yet confirmed'}</p>

      <h3>Task checklist</h3>
      <ul>
        {checklist.map((t, i) => (
          <li key={i}>{t.done ? '✅' : '⬜'} {t.task}</li>
        ))}
      </ul>

      <h3>Proof artifacts</h3>
      {visit.proofs.length === 0 && <p className="muted">No proof uploaded yet.</p>}
      <ul>
        {visit.proofs.map((p) => (
          <li key={p.id}>
            <strong>{p.type}</strong> — {new Date(p.capturedAt).toLocaleString()}
            {p.storageUrl && <> — <a href={p.storageUrl} target="_blank" rel="noreferrer">view</a></>}
          </li>
        ))}
      </ul>

      {visit.notes && <p><em>Notes: {visit.notes}</em></p>}
    </div>
  );
}
