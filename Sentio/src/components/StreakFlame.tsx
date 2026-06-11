import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';

import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

interface StreakFlameProps {
  count: number;
  showLabel?: boolean;
}

/** Flame + streak count; bounces whenever the count changes. */
export function StreakFlame({ count, showLabel = true }: StreakFlameProps) {
  const { palette } = useTheme();
  const scale = useSharedValue(1);
  const previous = useRef(count);

  useEffect(() => {
    if (count !== previous.current) {
      previous.current = count;
      scale.value = withSequence(
        withSpring(1.35, { damping: 6, stiffness: 280 }),
        withSpring(1, { damping: 12, stiffness: 220 })
      );
    }
  }, [count, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.flameRow, animatedStyle]}>
        <Text style={styles.flame}>🔥</Text>
        <Text style={[styles.count, { color: palette.secondary }]}>{count}</Text>
      </Animated.View>
      {showLabel ? (
        <Text style={[styles.label, { color: palette.textMuted }]}>
          day streak
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  flameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  flame: {
    fontSize: 28,
  },
  count: {
    fontFamily: Fonts.heading,
    fontSize: 28,
  },
  label: {
    fontFamily: Fonts.label,
    fontSize: 13,
  },
});
