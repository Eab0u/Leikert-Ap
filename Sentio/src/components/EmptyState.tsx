import { StyleSheet, Text, View } from 'react-native';

import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

interface EmptyStateProps {
  emoji: string;
  title: string;
  message: string;
}

export function EmptyState({ emoji, title, message }: EmptyStateProps) {
  const { palette } = useTheme();
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={[styles.title, { color: palette.text }]}>{title}</Text>
      <Text style={[styles.message, { color: palette.textMuted }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  emoji: {
    fontSize: 44,
  },
  title: {
    fontFamily: Fonts.heading,
    fontSize: 18,
    textAlign: 'center',
  },
  message: {
    fontFamily: Fonts.body,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 21,
  },
});
