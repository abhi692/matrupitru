import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, shadow } from '../theme';

// Clean-minimal RN component library — generous whitespace, soft shadow cards,
// one accent color, big legible type. Mirrors the web's shadcn-style
// components in spirit, not pixel-for-pixel.

export function Card({ children, style }) {
  return <View style={[s.card, style]}>{children}</View>;
}

export function CardTitle({ children, icon, style }) {
  return (
    <View style={s.cardTitleRow}>
      {icon && <Ionicons name={icon} size={18} color={colors.accent} style={{ marginRight: 7 }} />}
      <Text style={[s.cardTitle, style]}>{children}</Text>
    </View>
  );
}

export function CardDescription({ children, style }) {
  return <Text style={[s.cardDescription, style]}>{children}</Text>;
}

const VARIANT_STYLES = {
  default: { bg: colors.accent, text: colors.white },
  outline: { bg: colors.surface, text: colors.textPrimary, border: colors.separator },
  subtle: { bg: colors.accentSoft, text: colors.accentDark },
  emergency: { bg: colors.danger, text: colors.white },
  ghost: { bg: 'transparent', text: colors.textSecondary },
};

export function Button({ children, onPress, variant = 'default', icon, disabled, loading, style }) {
  const v = VARIANT_STYLES[variant] || VARIANT_STYLES.default;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      style={[
        s.button,
        { backgroundColor: v.bg, borderColor: v.border, borderWidth: v.border ? 1 : 0 },
        (disabled || loading) && { opacity: 0.4 },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={v.text} /> : (
        <>
          {icon && <Ionicons name={icon} size={17} color={v.text} />}
          {typeof children === 'string' ? <Text style={[s.buttonText, { color: v.text }]}>{children}</Text> : children}
        </>
      )}
    </TouchableOpacity>
  );
}

const BADGE_VARIANTS = {
  brand: { bg: colors.accentSoft, text: colors.accentDark },
  neutral: { bg: colors.neutralSoft, text: colors.textSecondary },
  warning: { bg: colors.warningSoft, text: colors.warning },
  danger: { bg: colors.dangerSoft, text: colors.danger },
  success: { bg: colors.successSoft, text: colors.accentDark },
};

export function Badge({ children, variant = 'neutral', style }) {
  const v = BADGE_VARIANTS[variant] || BADGE_VARIANTS.neutral;
  return (
    <View style={[s.badge, { backgroundColor: v.bg }, style]}>
      <Text style={[s.badgeText, { color: v.text }]}>{children}</Text>
    </View>
  );
}

export function Input(props) {
  return <TextInput style={s.input} placeholderTextColor={colors.textTertiary} {...props} />;
}

export function Label({ children }) {
  return <Text style={s.label}>{children}</Text>;
}

export function ErrorBox({ children }) {
  if (!children) return null;
  return (
    <View style={s.errorBox}>
      <Ionicons name="alert-circle" size={16} color={colors.danger} />
      <Text style={s.errorText}>{children}</Text>
    </View>
  );
}

export function EmptyState({ icon = 'checkmark-circle-outline', text }) {
  return (
    <View style={s.empty}>
      <Ionicons name={icon} size={28} color={colors.textTertiary} />
      <Text style={s.emptyText}>{text}</Text>
    </View>
  );
}

export function ScreenTitle({ children }) {
  return <Text style={s.screenTitle}>{children}</Text>;
}

const s = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    padding: 18,
    marginBottom: 14,
    ...shadow,
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  cardDescription: { fontSize: 13, color: colors.textSecondary, marginBottom: 10, lineHeight: 18 },
  button: { borderRadius: radius.control, paddingVertical: 14, paddingHorizontal: 18, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 7 },
  buttonText: { fontWeight: '600', fontSize: 15 },
  badge: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' },
  badgeText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  input: { borderWidth: 0, backgroundColor: colors.surfaceAlt, borderRadius: radius.control, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, marginBottom: 4, color: colors.textPrimary },
  label: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: 6, marginTop: 12, textTransform: 'uppercase', letterSpacing: 0.3 },
  errorBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.dangerSoft, padding: 13, borderRadius: radius.control, marginBottom: 14 },
  errorText: { color: colors.danger, fontSize: 13, flex: 1 },
  empty: { alignItems: 'center', paddingVertical: 24, gap: 8 },
  emptyText: { color: colors.textTertiary, fontSize: 14 },
  screenTitle: { fontSize: 28, fontWeight: '800', color: colors.textPrimary, letterSpacing: 0.2 },
});
