// Clean-minimal palette (Apple Health-style): mostly white/light-gray with one
// accent color doing the work, generous radius, no heavy borders — shadows
// instead. Still uses the brand green as the single accent so it stays
// recognizably "MatruPitru" rather than going fully neutral.
export const colors = {
  accent: '#1d9e75',
  accentDark: '#0c5945',
  accentSoft: '#e8f7f0',

  bg: '#f2f2f7',        // iOS system gray background
  surface: '#ffffff',
  surfaceAlt: '#f7f7f9',

  textPrimary: '#1c1c1e',
  textSecondary: '#6e6e73',
  textTertiary: '#aeaeb2',

  separator: '#e5e5ea',

  success: '#1d9e75',
  successSoft: '#e8f7f0',
  warning: '#ff9f0a',
  warningSoft: '#fff3e0',
  danger: '#ff3b30',
  dangerSoft: '#ffebe9',
  neutralSoft: '#f2f2f7',

  white: '#ffffff',
};

export const radius = { card: 18, control: 14, pill: 999 };

export const shadow = {
  shadowColor: '#000',
  shadowOpacity: 0.06,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 2 },
  elevation: 2,
};
