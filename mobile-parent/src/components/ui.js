import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { colors } from '../theme';

// Lightweight RN equivalents of the web's shadcn-style components
// (frontend/src/components/ui/*) — same visual language, native primitives.

export function Card({ children, style }) {
  return <View style={[s.card, style]}>{children}</View>;
}

export function CardTitle({ children, style }) {
  return <Text style={[s.cardTitle, style]}>{children}</Text>;
}

export function CardDescription({ children, style }) {
  return <Text style={[s.cardDescription, style]}>{children}</Text>;
}

const VARIANT_STYLES = {
  default: { bg: colors.brand500, text: colors.white },
  outline: { bg: colors.white, text: colors.stone700, border: colors.stone200 },
  subtle: { bg: colors.brand50, text: colors.brand700 },
  emergency: { bg: colors.rose600, text: colors.white },
  ghost: { bg: 'transparent', text: colors.stone600 },
};

export function Button({ children, onPress, variant = 'default', disabled, loading, style }) {
  const v = VARIANT_STYLES[variant] || VARIANT_STYLES.default;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[
        s.button,
        { backgroundColor: v.bg, borderColor: v.border, borderWidth: v.border ? 1 : 0 },
        (disabled || loading) && { opacity: 0.5 },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={v.text} /> : (
        typeof children === 'string' ? <Text style={[s.buttonText, { color: v.text }]}>{children}</Text> : children
      )}
    </TouchableOpacity>
  );
}

const BADGE_VARIANTS = {
  brand: { bg: colors.brand50, text: colors.brand700 },
  neutral: { bg: colors.stone100, text: colors.stone600 },
  warning: { bg: colors.warm50, text: colors.warm600 },
  danger: { bg: colors.rose50, text: colors.rose600 },
  success: { bg: colors.brand50, text: colors.brand700 },
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
  return <TextInput style={s.input} placeholderTextColor={colors.stone400} {...props} />;
}

export function Label({ children }) {
  return <Text style={s.label}>{children}</Text>;
}

export function ErrorBox({ children }) {
  if (!children) return null;
  return <Text style={s.errorBox}>{children}</Text>;
}

export function ScreenHeader({ title, onLogout }) {
  return (
    <View style={s.header}>
      <Text style={s.headerTitle}>{title}</Text>
      {onLogout && (
        <TouchableOpacity onPress={onLogout}>
          <Text style={s.logout}>Log out</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 18,
    marginBottom: 16,
    shadowColor: colors.brand600,
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  cardTitle: { fontSize: 17, fontWeight: '700', color: colors.stone800, marginBottom: 4 },
  cardDescription: { fontSize: 13, color: colors.stone500, marginBottom: 10 },
  button: { borderRadius: 10, paddingVertical: 13, paddingHorizontal: 18, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 },
  buttonText: { fontWeight: '700', fontSize: 15 },
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3, alignSelf: 'flex-start' },
  badgeText: { fontSize: 11, fontWeight: '700', textTransform: 'capitalize' },
  input: { borderWidth: 1, borderColor: colors.stone200, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 11, fontSize: 15, backgroundColor: colors.white, marginBottom: 4 },
  label: { fontSize: 13, fontWeight: '600', color: colors.stone600, marginBottom: 6, marginTop: 10 },
  errorBox: { backgroundColor: colors.rose50, color: colors.rose600, padding: 12, borderRadius: 10, marginBottom: 14, fontSize: 14 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 18, paddingTop: 54, paddingBottom: 14, backgroundColor: colors.white, borderBottomWidth: 1, borderBottomColor: colors.stone100 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: colors.brand700 },
  logout: { color: colors.stone500, fontSize: 13, fontWeight: '600' },
});
