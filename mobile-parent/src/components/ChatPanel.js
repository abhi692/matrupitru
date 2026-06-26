import { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';

export default function ChatPanel({ threadId }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [body, setBody] = useState('');
  const listRef = useRef(null);

  function refresh() {
    if (!threadId) return;
    api.get(`/threads/${threadId}/messages`).then(setMessages).catch(() => {});
  }

  useEffect(() => {
    refresh();
    if (!threadId) return;
    const interval = setInterval(refresh, 4000);
    return () => clearInterval(interval);
  }, [threadId]);

  async function send() {
    if (!body.trim()) return;
    try {
      await api.post(`/threads/${threadId}/messages`, { body });
      setBody('');
      refresh();
    } catch {
      // best-effort — chat retries on next poll
    }
  }

  if (!threadId) return <Text style={s.muted}>No conversation yet.</Text>;

  return (
    <View style={s.container}>
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        style={s.list}
        renderItem={({ item }) => {
          const mine = item.senderId === user.id;
          return (
            <View style={[s.bubbleRow, mine && s.bubbleRowMine]}>
              <View style={[s.bubble, mine ? s.bubbleMine : s.bubbleTheirs]}>
                {!mine && <Text style={s.sender}>{item.sender.name}</Text>}
                <Text style={mine ? s.bubbleTextMine : s.bubbleText}>{item.body}</Text>
              </View>
            </View>
          );
        }}
      />
      <View style={s.inputRow}>
        <TextInput style={s.input} value={body} onChangeText={setBody} placeholder="Type a message..." />
        <TouchableOpacity style={s.sendButton} onPress={send}>
          <Text style={s.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { height: 320 },
  list: { flex: 1 },
  muted: { color: colors.stone400, fontSize: 14 },
  bubbleRow: { marginVertical: 3, alignItems: 'flex-start' },
  bubbleRowMine: { alignItems: 'flex-end' },
  bubble: { maxWidth: '78%', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8 },
  bubbleMine: { backgroundColor: colors.brand500 },
  bubbleTheirs: { backgroundColor: colors.stone100 },
  sender: { fontSize: 10, fontWeight: '700', color: colors.stone500, marginBottom: 2 },
  bubbleText: { color: colors.stone700, fontSize: 14 },
  bubbleTextMine: { color: colors.white, fontSize: 14 },
  inputRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  input: { flex: 1, borderWidth: 1, borderColor: colors.stone200, borderRadius: 10, paddingHorizontal: 12, height: 42 },
  sendButton: { backgroundColor: colors.brand500, borderRadius: 10, paddingHorizontal: 16, justifyContent: 'center' },
  sendButtonText: { color: colors.white, fontWeight: '700' },
});
