/**
 * All design tokens live here. Duolingo vibe: playful, chunky, confident.
 * Light palette follows the spec exactly; dark palette mirrors it on a
 * deep blue-slate background (primary/secondary hues stay the same).
 */

export interface Palette {
  background: string;
  card: string;
  border: string;
  primary: string;
  secondary: string;
  text: string;
  textMuted: string;
  danger: string;
  success: string;
  inputBackground: string;
  /** Thick outline around the selected rating button */
  outline: string;
  /** Tab bar background */
  tabBar: string;
}

export const Palettes: Record<'light' | 'dark', Palette> = {
  light: {
    background: '#FFFFFF',
    card: '#F7F7F7',
    border: '#E5E5E5',
    primary: '#FF6B5E',
    secondary: '#FFC800',
    text: '#3C3C3C',
    textMuted: '#AFAFAF',
    danger: '#EA2B2B',
    success: '#58CC02',
    inputBackground: '#FFFFFF',
    outline: '#3C3C3C',
    tabBar: '#FFFFFF',
  },
  dark: {
    background: '#131F24',
    card: '#202F36',
    border: '#37464F',
    primary: '#FF6B5E',
    secondary: '#FFC800',
    text: '#F1F7FB',
    textMuted: '#7A8A93',
    danger: '#FF5A5A',
    success: '#58CC02',
    inputBackground: '#202F36',
    outline: '#F1F7FB',
    tabBar: '#131F24',
  },
};

export const Radius = {
  card: 16,
  button: 16,
  chip: 12,
  input: 12,
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

/** Nunito everywhere: ExtraBold headings/buttons, Bold labels, SemiBold body. */
export const Fonts = {
  heading: 'Nunito_800ExtraBold',
  label: 'Nunito_700Bold',
  body: 'Nunito_600SemiBold',
} as const;

export const MinTouchTarget = 48;

/** Darken a #rrggbb color by `amount` (0..1). Used for 3D button bottoms. */
export function darken(hex: string, amount = 0.2): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const channel = (shift: number): string =>
    Math.max(0, Math.round(((num >> shift) & 0xff) * (1 - amount)))
      .toString(16)
      .padStart(2, '0');
  return `#${channel(16)}${channel(8)}${channel(0)}`;
}

/**
 * Rating gradient: cool slate at 1 → neutral sunny yellow at 4 → vivid green
 * at 7. Index 0 corresponds to rating 1.
 */
export const RatingColors: readonly string[] = [
  '#7C8DA6',
  '#A8A16F',
  '#D3B437',
  '#FFC800',
  '#C2C901',
  '#90CB01',
  '#58CC02',
];

export const RatingLabels: readonly string[] = [
  'Rough',
  'Bad',
  'Meh',
  'Okay',
  'Good',
  'Great',
  'Amazing',
];

export function ratingColor(rating: number): string {
  return RatingColors[Math.min(Math.max(rating, 1), 7) - 1] as string;
}

export function ratingLabel(rating: number): string {
  return RatingLabels[Math.min(Math.max(rating, 1), 7) - 1] as string;
}
