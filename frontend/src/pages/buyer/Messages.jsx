import { useEffect, useState } from 'react';
import { MessageCircle } from 'lucide-react';
import { api } from '../../api/client';
import { useAuth } from '../../auth/AuthContext';
import { Card, CardTitle, CardDescription } from '../../components/ui/Card';
import ChatPanel from '../../components/ChatPanel';

export default function Messages() {
  const { user } = useAuth();
  const [threadId, setThreadId] = useState(null);

  useEffect(() => {
    if (!user?.familyId) return;
    api.get(`/families/${user.familyId}/thread`).then((t) => setThreadId(t.id));
  }, [user]);

  return (
    <div className="max-w-xl mx-auto">
      <Card>
        <CardTitle className="flex items-center gap-2"><MessageCircle className="h-5 w-5 text-brand-500" /> Care Manager</CardTitle>
        <CardDescription className="mb-4">Message your Care Manager directly — for non-urgent questions. Use SOS for emergencies.</CardDescription>
        <ChatPanel threadId={threadId} />
      </Card>
    </div>
  );
}
