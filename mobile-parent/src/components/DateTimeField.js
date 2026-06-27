import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors, radius } from '../theme';

// Real date + time selection (native pickers) instead of a hardcoded "1 hour
// from now" — tap once to pick the day, again to pick the time. Android shows
// the two native dialogs back-to-back; iOS shows a single combined spinner.
export default function DateTimeField({ value, onChange }) {
  const [mode, setMode] = useState(null); // 'date' | 'time' | null

  function openPicker() {
    setMode(Platform.OS === 'ios' ? 'datetime' : 'date');
  }

  function onPickerChange(event, selected) {
    if (event.type === 'dismissed') {
      setMode(null);
      return;
    }
    if (Platform.OS === 'android' && mode === 'date' && selected) {
      const merged = new Date(value);
      merged.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate());
      onChange(merged);
      setMode('time'); // chain into the time picker
      return;
    }
    if (Platform.OS === 'android' && mode === 'time' && selected) {
      const merged = new Date(value);
      merged.setHours(selected.getHours(), selected.getMinutes());
      onChange(merged);
      setMode(null);
      return;
    }
    // iOS combined picker
    if (selected) onChange(selected);
  }

  return (
    <View>
      <TouchableOpacity style={s.trigger} onPress={openPicker} activeOpacity={0.7}>
        <Ionicons name="calendar-outline" size={18} color={colors.accent} />
        <Text style={s.triggerText}>
          {value.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}
          {'  ·  '}
          {value.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </TouchableOpacity>

      {mode && Platform.OS === 'ios' && (
        <View>
          <DateTimePicker value={value} mode="datetime" display="spinner" onChange={onPickerChange} />
          <TouchableOpacity style={s.doneButton} onPress={() => setMode(null)}>
            <Text style={s.doneText}>Done</Text>
          </TouchableOpacity>
        </View>
      )}
      {mode && Platform.OS === 'android' && (
        <DateTimePicker value={value} mode={mode} display="default" onChange={onPickerChange} />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  trigger: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.surfaceAlt, borderRadius: radius.control,
    paddingHorizontal: 14, height: 48, marginBottom: 4,
  },
  triggerText: { fontSize: 15, color: colors.textPrimary, fontWeight: '500' },
  doneButton: { alignSelf: 'flex-end', paddingVertical: 8, paddingHorizontal: 16 },
  doneText: { color: colors.accent, fontWeight: '700', fontSize: 15 },
});
