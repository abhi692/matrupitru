import { useEffect, useRef, useState } from 'react';
import { Siren, HeartHandshake, Volume2, Mic } from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { useI18n } from '../../i18n/I18nContext';
import { SPEECH_LOCALE } from '../../i18n/translations';

const YES_WORDS = {
  en: ['yes', 'yeah', 'confirm'],
  hi: ['हाँ', 'हां', 'जी'],
  kn: ['ಹೌದು'],
};

// Dignified, low-friction parent UX: large text, minimal choices, one-tap SOS,
// real vernacular voice in/out via the browser's native Web Speech API — no
// third-party key needed (§1.1, §10.1).
export default function ParentApp() {
  const { user } = useAuth();
  const { locale, t } = useI18n();
  const [parent, setParent] = useState(null);
  const [visits, setVisits] = useState([]);
  const [sosStatus, setSosStatus] = useState('');
  const [error, setError] = useState('');
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  function refresh() {
    if (!user?.familyId) return;
    api.get(`/families/${user.familyId}/dashboard`).then((d) => {
      const p = d.parents.find((p) => p.userId === user.id) || d.parents[0];
      setParent(p);
      setVisits([...d.upcomingVisits, ...d.recentVisits.filter((v) => !v.parentConfirmedAt)]);
    }).catch((e) => setError(e.message));
  }

  useEffect(refresh, [user]);

  async function confirmVisit(visitId) {
    setError('');
    try {
      await api.post(`/visits/${visitId}/confirm`);
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function raiseSos() {
    if (!parent) return;
    setSosStatus('');
    try {
      await api.post(`/parents/${parent.id}/sos`, {});
      setSosStatus(t('helpOnWay'));
      speak(t('helpOnWay'));
    } catch (err) {
      setError(err.message);
    }
  }

  function speak(text) {
    if (!('speechSynthesis' in window)) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = SPEECH_LOCALE[locale] || 'en-US';
    window.speechSynthesis.speak(utterance);
  }

  function listenToConfirm(visitId) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setError('Voice input is not supported in this browser.');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = SPEECH_LOCALE[locale] || 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognitionRef.current = recognition;

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript.toLowerCase().trim();
      const yesWords = YES_WORDS[locale] || YES_WORDS.en;
      if (yesWords.some((w) => transcript.includes(w))) {
        confirmVisit(visitId);
      }
      setListening(false);
    };
    recognition.onerror = () => setListening(false);
    recognition.onend = () => setListening(false);

    setListening(true);
    recognition.start();
  }

  const pendingConfirm = visits.filter((v) => v.status === 'completed' && !v.parentConfirmedAt);
  const speechSupported = 'speechSynthesis' in window;

  return (
    <div className="max-w-md mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-100 text-brand-700">
          <HeartHandshake className="h-6 w-6" />
        </span>
        <h1 className="text-3xl font-bold text-brand-700">{t('namaste')}, {parent?.user.name || ''}</h1>
        {speechSupported && (
          <button
            onClick={() => speak(`${t('namaste')}, ${parent?.user.name || ''}. ${t('didCaregiverVisit')}`)}
            className="ml-auto p-2 rounded-full text-brand-600 hover:bg-brand-50"
            aria-label={t('listenAloud')}
          >
            <Volume2 className="h-5 w-5" />
          </button>
        )}
      </div>

      {error && <p className="text-base text-rose-600 bg-rose-50 rounded-card px-4 py-3">{error}</p>}

      <button
        onClick={raiseSos}
        className="w-full flex items-center justify-center gap-3 rounded-card bg-rose-600 hover:bg-rose-700 text-white text-xl font-bold py-6 shadow-soft-lg transition-colors"
      >
        <Siren className="h-7 w-7" /> {t('iNeedHelp')}
      </button>
      {sosStatus && <p className="text-lg text-brand-700 bg-brand-50 rounded-card px-4 py-3">{sosStatus}</p>}

      <div className="bg-white rounded-card border border-stone-100 shadow-soft p-6">
        <h2 className="text-xl font-semibold text-stone-800 mb-4">{t('didCaregiverVisit')}</h2>
        {pendingConfirm.length === 0 ? (
          <p className="text-lg text-stone-400">{t('noVisitWaiting')}</p>
        ) : (
          <div className="space-y-4">
            {pendingConfirm.map((v) => (
              <div key={v.id} className="border border-stone-100 rounded-control p-4">
                <p className="text-lg text-stone-700 capitalize mb-3">
                  {v.type} {t('visit')} — {new Date(v.checkOutAt).toLocaleString()}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => confirmVisit(v.id)}
                    className="flex-1 rounded-control bg-brand-500 hover:bg-brand-600 text-white text-lg font-semibold py-4 transition-colors"
                  >
                    {t('yesTheyVisited')}
                  </button>
                  {window.SpeechRecognition || window.webkitSpeechRecognition ? (
                    <button
                      onClick={() => listenToConfirm(v.id)}
                      className={`rounded-control px-5 transition-colors ${listening ? 'bg-rose-100 text-rose-600' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
                      aria-label={t('speakToConfirm')}
                    >
                      <Mic className="h-5 w-5" />
                    </button>
                  ) : null}
                </div>
                {listening && <p className="text-sm text-stone-400 mt-2">{t('listening')}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
