import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { api } from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import { Card, CardTitle, CardDescription, ScreenTitle } from '../../components/ui';
import ChatPanel from '../../components/ChatPanel';

export default function MessagesScreen() {
  const { user } = useAuth();
  const [threadId, setThreadId] = useState(null);

  useEffect(() => {
    if (!user?.familyId) return;
    api.get(`/families/${user.familyId}/thread`).then((t) => setThreadId(t.id));
  }, [user]);

  return (
    <ScrollView contentContainerStyle={s.content}>
      <ScreenTitle>Messages</ScreenTitle>
      <Card>
        <CardTitle icon="chatbubble-ellipses-outline">Care Manager</CardTitle>
        <CardDescription>For non-urgent questions — use SOS for emergencies.</CardDescription>
        <ChatPanel threadId={threadId} />
      </Card>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  content: { padding: 18, paddingTop: 60, paddingBottom: 40 },
});
