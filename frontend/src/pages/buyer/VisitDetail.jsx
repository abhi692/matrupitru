import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Circle, ShieldCheck, ShieldAlert, Image as ImageIcon, BadgeCheck, Star } from 'lucide-react';
import { api } from '../../api/client';
import { Card, CardTitle } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

export default function VisitDetail() {
  const { id } = useParams();
  const [visit, setVisit] = useState(null);
  const [error, setError] = useState('');
  const [rating, setRating] = useState(null);
  const [hoverStar, setHoverStar] = useState(0);
  const [comment, setComment] = useState('');

  useEffect(() => {
    api.get(`/visits/${id}`).then(setVisit).catch((e) => setError(e.message));
    api.get(`/visits/${id}/rating`).then(setRating).catch(() => {});
  }, [id]);

  async function submitRating(stars) {
    try {
      const result = await api.post(`/visits/${id}/rating`, { stars, comment });
      setRating(result);
    } catch (err) {
      setError(err.message);
    }
  }

  if (error) return <p className="text-rose-600 bg-rose-50 rounded-control px-4 py-3">{error}</p>;
  if (!visit) return <p className="text-stone-400 text-center py-12">Loading visit...</p>;

  const checklist = JSON.parse(visit.taskChecklistJson || '[]');

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <Link to="/buyer" className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-brand-600">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to dashboard
      </Link>

      <Card>
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="capitalize text-xl">Visit — {visit.type}</CardTitle>
          <Badge variant="brand" className="capitalize">{visit.status}</Badge>
        </div>

        <div className="grid grid-cols-2 gap-y-3 text-sm mb-4">
          <span className="text-stone-400">Caregiver</span>
          <span className="font-medium text-stone-700 text-right">
            {visit.caregiver?.name || 'Unassigned'}
            {visit.caregiver?.caregiverProfile?.verificationStatus === 'verified' && (
              <span className="inline-flex items-center gap-1 text-brand-600 text-xs ml-2 align-middle">
                <BadgeCheck className="h-3.5 w-3.5" /> Verified
              </span>
            )}
            {visit.caregiver?.caregiverProfile?.rating > 0 && (
              <span className="inline-flex items-center gap-0.5 text-warm-600 text-xs ml-2 align-middle">
                <Star className="h-3 w-3 fill-current" /> {visit.caregiver.caregiverProfile.rating.toFixed(1)}
              </span>
            )}
          </span>

          <span className="text-stone-400">Check-in</span>
          <span className="font-medium text-stone-700 text-right">{visit.checkInAt ? new Date(visit.checkInAt).toLocaleString() : '—'}</span>

          <span className="text-stone-400">Check-out</span>
          <span className="font-medium text-stone-700 text-right">{visit.checkOutAt ? new Date(visit.checkOutAt).toLocaleString() : '—'}</span>

          <span className="text-stone-400">Parent confirmed</span>
          <span className="font-medium text-stone-700 text-right">{visit.parentConfirmedAt ? new Date(visit.parentConfirmedAt).toLocaleString() : 'Not yet confirmed'}</span>
        </div>

        <div
          className={cnFlag(visit.geoVerified)}
        >
          {visit.geoVerified ? <ShieldCheck className="h-4.5 w-4.5 shrink-0" /> : <ShieldAlert className="h-4.5 w-4.5 shrink-0" />}
          {visit.geoVerified
            ? 'Geo-verified — caregiver confirmed at home address'
            : 'Not geo-verified — flagged for ops review'}
        </div>

        <div className="mt-6">
          <h3 className="text-sm font-semibold text-stone-700 mb-2">Task checklist</h3>
          <ul className="space-y-1.5">
            {checklist.map((t, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                {t.done ? <CheckCircle2 className="h-4 w-4 text-brand-500" /> : <Circle className="h-4 w-4 text-stone-300" />}
                <span className={t.done ? 'text-stone-700' : 'text-stone-400'}>{t.task}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-6">
          <h3 className="text-sm font-semibold text-stone-700 mb-2">Proof artifacts</h3>
          {visit.proofs.length === 0 ? (
            <p className="text-stone-400 text-sm">No proof uploaded yet.</p>
          ) : (
            <ul className="space-y-2">
              {visit.proofs.map((p) => (
                <li key={p.id} className="flex items-center justify-between text-sm border border-stone-100 rounded-control px-3 py-2">
                  <span className="flex items-center gap-2">
                    <ImageIcon className="h-4 w-4 text-stone-400" />
                    <span className="font-medium text-stone-700 capitalize">{p.type.replace(/_/g, ' ')}</span>
                  </span>
                  <span className="text-stone-400 text-xs">
                    {new Date(p.capturedAt).toLocaleString()}
                    {p.storageUrl && (
                      <>
                        {' · '}
                        <a href={p.storageUrl} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline">view</a>
                      </>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {visit.notes && <p className="mt-4 text-sm text-stone-500 italic">Notes: {visit.notes}</p>}

        {visit.status === 'completed' && visit.caregiverId && (
          <div className="mt-6 border-t border-stone-100 pt-4">
            <h3 className="text-sm font-semibold text-stone-700 mb-2">Rate this caregiver</h3>
            {rating ? (
              <div className="flex items-center gap-1 text-warm-600">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star key={n} className={`h-5 w-5 ${n <= rating.stars ? 'fill-current' : ''}`} />
                ))}
                <span className="text-stone-400 text-sm ml-2">Thanks for your feedback{rating.comment ? `: "${rating.comment}"` : ''}</span>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onMouseEnter={() => setHoverStar(n)}
                      onMouseLeave={() => setHoverStar(0)}
                      onClick={() => submitRating(n)}
                      className="text-warm-500"
                    >
                      <Star className={`h-7 w-7 ${n <= hoverStar ? 'fill-current' : ''}`} />
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Optional comment"
                  className="w-full rounded-control border border-stone-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-300"
                />
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}

function cnFlag(verified) {
  return [
    'flex items-center gap-2 text-sm font-medium rounded-control px-3 py-2.5',
    verified ? 'bg-brand-50 text-brand-700' : 'bg-warm-50 text-warm-600',
  ].join(' ');
}
