import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Modal, FlatList, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow } from '../theme';
import { COUNTRIES, DEFAULT_COUNTRY, flagEmoji, matchCountryFromValue } from './countries';

function deriveDigits(value, country) {
  if (!value || !country) return '';
  const prefix = `+${country.dialCode}`;
  return value.startsWith(prefix) ? value.slice(prefix.length) : '';
}

// Phone entry with a real country picker (flag + dial code), not just India —
// plenty of users are Indian but settled abroad (NRIs), or aren't Indian at
// all. Defaults to India since that's this app's primary market. `value`/
// `onChange` work with the full E.164 string ("+<dialCode><digits>").
export default function PhoneInput({ value, onChange, style }) {
  const [country, setCountry] = useState(() => matchCountryFromValue(value) || DEFAULT_COUNTRY);
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const digits = deriveDigits(value, country);
  const filtered = COUNTRIES.filter(
    (c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.dialCode.includes(search)
  );

  function handleDigitsChange(text) {
    const next = text.replace(/\D/g, '').slice(0, 14);
    onChange(next ? `+${country.dialCode}${next}` : '');
  }

  function selectCountry(c) {
    const currentDigits = deriveDigits(value, country);
    setCountry(c);
    setOpen(false);
    setSearch('');
    onChange(currentDigits ? `+${c.dialCode}${currentDigits}` : '');
  }

  return (
    <View style={[s.wrap, style]}>
      <TouchableOpacity style={s.prefixWrap} onPress={() => setOpen(true)} activeOpacity={0.7}>
        <Text style={s.flag}>{flagEmoji(country.iso2)}</Text>
        <Text style={s.prefix}>+{country.dialCode}</Text>
        <Ionicons name="chevron-down" size={14} color={colors.textTertiary} />
      </TouchableOpacity>
      <TextInput
        style={s.input}
        value={digits}
        onChangeText={handleDigitsChange}
        keyboardType="number-pad"
        placeholder="Phone number"
        placeholderTextColor={colors.textTertiary}
      />

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={s.backdrop} onPress={() => setOpen(false)}>
          <View style={s.sheet} onStartShouldSetResponder={() => true}>
            <Text style={s.sheetTitle}>Select country</Text>
            <TextInput
              autoFocus
              value={search}
              onChangeText={setSearch}
              placeholder="Search country or code"
              placeholderTextColor={colors.textTertiary}
              style={s.searchInput}
            />
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.iso2}
              style={{ maxHeight: 320 }}
              renderItem={({ item }) => (
                <TouchableOpacity style={s.option} activeOpacity={0.6} onPress={() => selectCountry(item)}>
                  <Text style={s.optionFlag}>{flagEmoji(item.iso2)}</Text>
                  <Text style={[s.optionText, item.iso2 === country.iso2 && s.optionTextActive]}>{item.name}</Text>
                  <Text style={s.optionCode}>+{item.dialCode}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

export function isValidPhoneNumber(value) {
  const country = matchCountryFromValue(value);
  if (!country) return false;
  const digits = deriveDigits(value, country);
  if (country.iso2 === 'IN') return /^[6-9]\d{9}$/.test(digits);
  return digits.length >= 4 && digits.length <= 14;
}

const s = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surfaceAlt, borderRadius: radius.control, marginBottom: 4, overflow: 'hidden' },
  prefixWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingLeft: 14, paddingRight: 10, paddingVertical: 13,
    backgroundColor: colors.separator, borderRightWidth: 1, borderRightColor: colors.separator,
  },
  flag: { fontSize: 16, lineHeight: 18 },
  prefix: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  input: { flex: 1, paddingVertical: 13, paddingHorizontal: 14, fontSize: 15, color: colors.textPrimary },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface, borderTopLeftRadius: radius.card, borderTopRightRadius: radius.card,
    paddingTop: 14, paddingBottom: 28, paddingHorizontal: 16, ...shadow,
  },
  sheetTitle: { fontSize: 13, fontWeight: '700', color: colors.textTertiary, textTransform: 'uppercase', marginBottom: 10 },
  searchInput: { backgroundColor: colors.surfaceAlt, borderRadius: radius.control, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, color: colors.textPrimary, marginBottom: 8 },
  option: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.separator },
  optionFlag: { fontSize: 18 },
  optionText: { flex: 1, fontSize: 15, color: colors.textPrimary },
  optionTextActive: { color: colors.accent, fontWeight: '700' },
  optionCode: { fontSize: 14, color: colors.textTertiary },
});
