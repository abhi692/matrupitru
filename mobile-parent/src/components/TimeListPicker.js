import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { colors, radius } from '../theme';

function pad(n) {
  return String(n).padStart(2, '0');
}

// Pick daily reminder times with the device's native clock UI instead of typing
// "08:00, 20:00" by hand — taps "Add time", spins the clock, gets a removable
// chip. Builds the same ["HH:MM", ...] array the backend schedule API expects.
export default function TimeListPicker({ times, onChange }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const [draft, setDraft] = useState(new Date());

  function addTime(date) {
    const hhmm = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
    if (!times.includes(hhmm)) onChange([...times, hhmm].sort());
  }

  function removeTime(hhmm) {
    onChange(times.filter((t) => t !== hhmm));
  }

  function onPickerChange(event, selectedDate) {
    if (Platform.OS === 'android') setPickerOpen(false);
    if (event.type === 'dismissed') return;
    if (selectedDate) addTime(selectedDate);
  }

  return (
    <View>
      <View style={s.chipRow}>
        {times.map((t) => (
          <View key={t} style={s.chip}>
            <Text style={s.chipText}>{t}</Text>
            <TouchableOpacity onPress={() => removeTime(t)} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>
        ))}
        <TouchableOpacity style={s.addButton} onPress={() => { setDraft(new Date()); setPickerOpen(true); }} activeOpacity={0.7}>
          <Ionicons name="add" size={16} color={colors.accent} />
          <Text style={s.addButtonText}>Add time</Text>
        </TouchableOpacity>
      </View>

      {pickerOpen && (
        <DateTimePicker
          value={draft}
          mode="time"
          is24Hour
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onPickerChange}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.accentSoft, borderRadius: radius.pill,
    paddingVertical: 7, paddingHorizontal: 12,
  },
  chipText: { color: colors.accentDark, fontWeight: '600', fontSize: 14 },
  addButton: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: colors.surfaceAlt, borderRadius: radius.pill,
    paddingVertical: 7, paddingHorizontal: 12,
  },
  addButtonText: { color: colors.accent, fontWeight: '600', fontSize: 14 },
});
