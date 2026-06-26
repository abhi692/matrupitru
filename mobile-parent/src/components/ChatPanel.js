import { useEffect, useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { colors, radius } from '../theme';

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
        <TextInput style={s.input} value={body} onChangeText={setBody} placeholder="Message..." placeholderTextColor={colors.textTertiary} />
        <TouchableOpacity style={s.sendButton} onPress={send}>
          <Ionicons name="send" size={18} color={colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { height: 340 },
  list: { flex: 1 },
  muted: { color: colors.textTertiary, fontSize: 14 },
  bubbleRow: { marginVertical: 3, alignItems: 'flex-start' },
  bubbleRowMine: { alignItems: 'flex-end' },
  bubble: { maxWidth: '78%', borderRadius: 16, paddingHorizontal: 13, paddingVertical: 9 },
  bubbleMine: { backgroundColor: colors.accent },
  bubbleTheirs: { backgroundColor: colors.surfaceAlt },
  sender: { fontSize: 10, fontWeight: '700', color: colors.textSecondary, marginBottom: 2 },
  bubbleText: { color: colors.textPrimary, fontSize: 14 },
  bubbleTextMine: { color: colors.white, fontSize: 14 },
  inputRow: { flexDirection: 'row', gap: 8, marginTop: 8, alignItems: 'center' },
  input: { flex: 1, backgroundColor: colors.surfaceAlt, borderRadius: radius.control, paddingHorizontal: 14, height: 44, color: colors.textPrimary },
  sendButton: { backgroundColor: colors.accent, borderRadius: radius.control, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
});
