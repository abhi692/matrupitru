import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, ShieldCheck, ShieldAlert, Pill, Star, Activity, Siren, CalendarClock,
} from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { Card } from '../../components/ui/Card';

const ICONS = {
  visit: ShieldCheck,
  vitals_flagged: Activity,
  sos: Siren,
  med_missed: Pill,
  medication_given: Pill,
  medication_missed: Pill,
  rating: Star,
};

const COLORS = {
  sos: 'text-rose-600 bg-rose-50',
  med_missed: 'text-warm-600 bg-warm-50',
  medication_missed: 'text-warm-600 bg-warm-50',
  vitals_flagged: 'text-warm-600 bg-warm-50',
  visit: 'text-brand-600 bg-brand-50',
  medication_given: 'text-brand-600 bg-brand-50',
  rating: 'text-amber-600 bg-amber-50',
};

// A single chronological narrative feed instead of separate dashboard widgets —
// "what happened with my parent" told as a story, not six panels to mentally merge.
export default function Timeline() {
  const { user } = useAuth();
  const [events, setEvents] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user?.familyId) return;
    api.get(`/families/${user.familyId}/timeline`).then(setEvents).catch((e) => setError(e.message));
  }, [user]);

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <Link to="/buyer" className="inline-flex items-center gap-1.5 text-sm text-stone-500 hover:text-brand-600">
        <ArrowLeft className="h-3.5 w-3.5" /> Back to dashboard
      </Link>

      <div className="flex items-center gap-2">
        <CalendarClock className="h-5 w-5 text-brand-500" />
        <h1 className="text-xl font-bold text-stone-900">Care timeline</h1>
      </div>

      {error && <p className="text-rose-600 bg-rose-50 rounded-control px-4 py-3">{error}</p>}
      {!events && !error && <p className="text-stone-400 text-center py-12">Loading timeline...</p>}
      {events && events.length === 0 && <p className="text-stone-400 text-sm">Nothing to show yet.</p>}

      {events && events.length > 0 && (
        <div className="relative pl-6">
          <div className="absolute left-[7px] top-2 bottom-2 w-px bg-stone-200" />
          <ul className="space-y-4">
            {events.map((e) => {
              const Icon = ICONS[e.type] || Activity;
              const color = COLORS[e.type] || 'text-stone-500 bg-stone-100';
              return (
                <li key={e.id} className="relative">
                  <span className={`absolute -left-6 top-0.5 flex h-4 w-4 items-center justify-center rounded-full ${color}`}>
                    <Icon className="h-2.5 w-2.5" />
                  </span>
                  <Card className="py-3">
                    <p className="text-sm text-stone-700">{e.summary}</p>
                    <p className="text-xs text-stone-400 mt-1">{new Date(e.at).toLocaleString()}</p>
                  </Card>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
