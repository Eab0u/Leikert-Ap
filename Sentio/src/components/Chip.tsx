import { Pressable, StyleSheet, Text } from 'react-native';

import { darken, Fonts, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

interface ChipProps {
  label: string;
  emoji: string;
  selected: boolean;
  onToggle?: () => void;
}

/** Pill-shaped toggle: outlined when off, filled primary when on. */
export function Chip({ label, emoji, selected, onToggle }: ChipProps) {
  const { palette } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onToggle}
      disabled={!onToggle}
      style={[
        styles.base,
        {
          backgroundColor: selected ? palette.primary : 'transparent',
          borderColor: selected ? darken(palette.primary, 0.2) : palette.border,
        },
      ]}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text
        style={[
          styles.label,
          { color: selected ? '#FFFFFF' : palette.text },
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 2,
    borderRadius: Radius.chip,
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 40,
  },
  emoji: {
    fontSize: 14,
  },
  label: {
    fontFamily: Fonts.label,
    fontSize: 14,
  },
});
