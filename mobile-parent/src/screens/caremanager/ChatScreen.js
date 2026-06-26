import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { api } from '../../api/client';
import { Card, CardTitle, ScreenTitle } from '../../components/ui';
import Select from '../../components/Select';
import ChatPanel from '../../components/ChatPanel';

export default function ChatScreen() {
  const [families, setFamilies] = useState([]);
  const [activeFamilyId, setActiveFamilyId] = useState('');
  const [activeThreadId, setActiveThreadId] = useState(null);

  const load = useCallback(() => {
    api.get('/families').then(setFamilies);
  }, []);

  useEffect(load, [load]);

  async function openThread(familyId) {
    setActiveFamilyId(familyId);
    const thread = await api.get(`/families/${familyId}/thread`);
    setActiveThreadId(thread.id);
  }

  return (
    <ScrollView contentContainerStyle={s.content}>
      <ScreenTitle>Messages</ScreenTitle>
      <Card>
        <CardTitle icon="chatbubbles-outline">Choose a family</CardTitle>
        <Select
          value={activeFamilyId}
          onValueChange={openThread}
          placeholder="Select a family"
          items={families.map((f) => ({ value: f.id, label: f.users.find((u) => u.role === 'buyer')?.name || 'Family' }))}
        />
        {activeThreadId && <ChatPanel threadId={activeThreadId} />}
      </Card>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  content: { padding: 18, paddingTop: 60, paddingBottom: 40 },
});
