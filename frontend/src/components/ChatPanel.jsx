import { useEffect, useRef, useState } from 'react';
import { Send } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { Button } from './ui/Button';

export default function ChatPanel({ threadId }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const bottomRef = useRef(null);

  function refresh() {
    if (!threadId) return;
    api.get(`/threads/${threadId}/messages`).then(setMessages).catch((e) => setError(e.message));
  }

  useEffect(() => {
    refresh();
    if (!threadId) return;
    const interval = setInterval(refresh, 4000);
    return () => clearInterval(interval);
  }, [threadId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send(e) {
    e.preventDefault();
    if (!body.trim()) return;
    setError('');
    try {
      await api.post(`/threads/${threadId}/messages`, { body });
      setBody('');
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  if (!threadId) return <p className="text-stone-400 text-sm">No conversation yet.</p>;

  return (
    <div className="flex flex-col h-96">
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {messages.length === 0 && <p className="text-stone-400 text-sm text-center mt-8">No messages yet — say hello.</p>}
        {messages.map((m) => {
          const mine = m.senderId === user.id;
          return (
            <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[75%] rounded-control px-3 py-2 text-sm ${mine ? 'bg-brand-500 text-white' : 'bg-stone-100 text-stone-700'}`}>
                {!mine && <div className="text-[11px] font-semibold opacity-70 mb-0.5">{m.sender.name}</div>}
                {m.body}
                <div className={`text-[10px] mt-1 ${mine ? 'text-white/70' : 'text-stone-400'}`}>
                  {new Date(m.createdAt).toLocaleTimeString()}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      {error && <p className="text-rose-600 text-xs mt-1">{error}</p>}
      <form onSubmit={send} className="flex gap-2 mt-3">
        <input
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 h-10 rounded-control border border-stone-200 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand-200 focus:border-brand-400"
        />
        <Button type="submit" size="default"><Send className="h-4 w-4" /></Button>
      </form>
    </div>
  );
}
