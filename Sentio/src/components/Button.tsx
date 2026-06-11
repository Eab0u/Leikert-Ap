import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { darken, Fonts, MinTouchTarget, Radius } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

type Variant = 'primary' | 'secondary' | 'outline' | 'danger';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * The signature Duolingo move: solid fill with a 4px darker bottom border so
 * the button looks physically pressable. On press it translates down 2px and
 * the bottom border shrinks to 2px.
 */
export function Button({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
}: ButtonProps) {
  const { palette } = useTheme();
  const [pressed, setPressed] = useState(false);

  const fill =
    variant === 'primary'
      ? palette.primary
      : variant === 'secondary'
        ? palette.secondary
        : variant === 'danger'
          ? palette.danger
          : palette.card;
  const bottom = variant === 'outline' ? darken(palette.border, 0.12) : darken(fill, 0.2);
  const textColor =
    variant === 'outline'
      ? palette.text
      : variant === 'secondary'
        ? '#3C3C3C'
        : '#FFFFFF';

  const inactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive }}
      onPress={onPress}
      disabled={inactive}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[
        styles.base,
        {
          backgroundColor: fill,
          borderBottomColor: bottom,
          borderBottomWidth: pressed ? 2 : 4,
          transform: [{ translateY: pressed ? 2 : 0 }],
          opacity: inactive ? 0.5 : 1,
        },
        variant === 'outline' && {
          borderWidth: 2,
          borderColor: palette.border,
          borderBottomWidth: pressed ? 2 : 4,
        },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.label, { color: textColor }]}>{title.toUpperCase()}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: MinTouchTarget,
    borderRadius: Radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  label: {
    fontFamily: Fonts.heading,
    fontSize: 15,
    letterSpacing: 0.8,
  },
});
