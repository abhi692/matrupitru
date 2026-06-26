import { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, FlatList, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow } from '../theme';

// Custom modal-based picker instead of the native @react-native-picker/picker
// dropdown — the native Android Picker widget has had long-standing rendering
// issues in Expo Go (popup not opening, or opening with zero visible/tappable
// area depending on device/Android version). A plain Modal + list is slower to
// open but renders identically and reliably across every device.
export default function Select({ value, onValueChange, items, placeholder = 'Select...' }) {
  const [open, setOpen] = useState(false);
  const selected = items.find((i) => i.value === value);

  return (
    <>
      <TouchableOpacity style={s.trigger} onPress={() => setOpen(true)} activeOpacity={0.7}>
        <Text style={[s.triggerText, !selected && s.placeholder]} numberOfLines={1}>
          {selected ? selected.label : placeholder}
        </Text>
        <Ionicons name="chevron-down" size={18} color={colors.textTertiary} />
      </TouchableOpacity>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={s.backdrop} onPress={() => setOpen(false)}>
          <View style={s.sheet} onStartShouldSetResponder={() => true}>
            <Text style={s.sheetTitle}>{placeholder}</Text>
            <FlatList
              data={items}
              keyExtractor={(item) => String(item.value)}
              style={{ maxHeight: 360 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={s.option}
                  activeOpacity={0.6}
                  onPress={() => {
                    onValueChange(item.value);
                    setOpen(false);
                  }}
                >
                  <Text style={[s.optionText, item.value === value && s.optionTextActive]}>{item.label}</Text>
                  {item.value === value && <Ionicons name="checkmark" size={18} color={colors.accent} />}
                </TouchableOpacity>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  trigger: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: colors.surfaceAlt, borderRadius: radius.control,
    paddingHorizontal: 14, height: 48, marginBottom: 4,
  },
  triggerText: { fontSize: 15, color: colors.textPrimary, flex: 1, marginRight: 8 },
  placeholder: { color: colors.textTertiary },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface, borderTopLeftRadius: radius.card, borderTopRightRadius: radius.card,
    paddingTop: 14, paddingBottom: 28, paddingHorizontal: 8, ...shadow,
  },
  sheetTitle: { fontSize: 13, fontWeight: '700', color: colors.textTertiary, textTransform: 'uppercase', paddingHorizontal: 16, marginBottom: 6 },
  option: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingHorizontal: 16, borderTopWidth: 1, borderTopColor: colors.separator },
  optionText: { fontSize: 16, color: colors.textPrimary },
  optionTextActive: { color: colors.accent, fontWeight: '600' },
});
