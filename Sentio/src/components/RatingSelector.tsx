import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { darken, Fonts, ratingColor, ratingLabel, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import type { Rating } from '@/lib/types';

const RATINGS: readonly Rating[] = [1, 2, 3, 4, 5, 6, 7];
const GAP = 8;
const MAX_BUTTON_SIZE = 64;

interface RatingButtonProps {
  rating: Rating;
  selected: boolean;
  size: number;
  onPress: () => void;
}

function RatingButton({ rating, selected, size, onPress }: RatingButtonProps) {
  const { palette } = useTheme();
  const [pressed, setPressed] = useState(false);
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSpring(selected ? 1.1 : 1, { damping: 14, stiffness: 220 });
  }, [selected, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const fill = ratingColor(rating);
  // Yellowish middle of the gradient needs dark text for contrast.
  const numberColor = rating >= 3 && rating <= 5 ? '#3C3C3C' : '#FFFFFF';

  return (
    <Animated.View style={[animatedStyle, selected && styles.selectedWrap]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Rate ${rating}, ${ratingLabel(rating)}`}
        accessibilityState={{ selected }}
        onPress={onPress}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        style={[
          styles.button,
          {
            width: size,
            height: size,
            backgroundColor: fill,
            borderColor: palette.outline,
            borderWidth: selected ? 3 : 0,
            borderBottomWidth: pressed ? 2 : 4,
            borderBottomColor: selected ? palette.outline : darken(fill, 0.2),
            transform: [{ translateY: pressed ? 2 : 0 }],
          },
        ]}>
        <Text style={[styles.number, { color: numberColor, fontSize: size * 0.4 }]}>
          {rating}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

interface RatingSelectorProps {
  value: Rating | null;
  onSelect: (rating: Rating) => void;
}

/**
 * The hero interaction: seven chunky 3D buttons colored along the
 * slate → yellow → green gradient, in one row (or 4 over 3 on small screens).
 */
export function RatingSelector({ value, onSelect }: RatingSelectorProps) {
  const { palette } = useTheme();
  const [containerWidth, setContainerWidth] = useState(0);

  const fitsOneRow = containerWidth >= 7 * 48 + 6 * GAP;
  const perRow = fitsOneRow ? 7 : 4;
  const size = Math.min(
    MAX_BUTTON_SIZE,
    containerWidth > 0 ? (containerWidth - (perRow - 1) * GAP) / perRow : 48
  );

  const rows: Rating[][] = fitsOneRow
    ? [[...RATINGS]]
    : [RATINGS.slice(0, 4) as Rating[], RATINGS.slice(4) as Rating[]];

  return (
    <View
      style={styles.container}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}>
      {containerWidth > 0 &&
        rows.map((row) => (
          <View key={row.join('-')} style={styles.row}>
            {row.map((rating) => (
              <RatingButton
                key={rating}
                rating={rating}
                selected={value === rating}
                size={size}
                onPress={() => onSelect(rating)}
              />
            ))}
          </View>
        ))}
      <Text
        style={[
          styles.label,
          { color: value ? ratingColor(value) : palette.textMuted },
        ]}>
        {value ? ratingLabel(value) : 'How was your day?'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: GAP + 4,
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: GAP,
  },
  selectedWrap: {
    zIndex: 1,
  },
  button: {
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  number: {
    fontFamily: Fonts.heading,
  },
  label: {
    fontFamily: Fonts.heading,
    fontSize: 24,
    marginTop: Spacing.xs,
  },
});
