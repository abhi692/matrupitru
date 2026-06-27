import { View, Text, TextInput, StyleSheet } from 'react-native';
import { colors, radius } from '../theme';

// India-only phone entry: the +91 country code is fixed and shown, the user
// only ever types the 10-digit mobile number. `value`/`onChange` work with
// the full E.164 string ("+91XXXXXXXXXX") so callers can treat this exactly
// like a normal phone field — no format conversion needed at the call site.
export default function PhoneInput({ value, onChange, style }) {
  const digits = (value || '').replace(/^\+91/, '');

  function handleChange(text) {
    const next = text.replace(/\D/g, '').slice(0, 10);
    onChange(next ? `+91${next}` : '');
  }

  return (
    <View style={[s.wrap, style]}>
      <Text style={s.prefix}>+91</Text>
      <TextInput
        style={s.input}
        value={digits}
        onChangeText={handleChange}
        keyboardType="number-pad"
        maxLength={10}
        placeholder="9900000000"
        placeholderTextColor={colors.textTertiary}
      />
    </View>
  );
}

export function isValidIndianPhone(value) {
  return /^\+91[6-9]\d{9}$/.test(value || '');
}

const s = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceAlt, borderRadius: radius.control, marginBottom: 4 },
  prefix: { paddingLeft: 14, paddingRight: 8, fontSize: 15, fontWeight: '600', color: colors.textSecondary },
  input: { flex: 1, paddingVertical: 13, paddingRight: 14, fontSize: 15, color: colors.textPrimary },
});
