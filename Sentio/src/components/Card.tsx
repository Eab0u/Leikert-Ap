import { View, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';

import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

interface CardProps extends ViewProps {
  style?: StyleProp<ViewStyle>;
}

/** Flat card: subtle background, 2px border, no shadows. */
export function Card({ style, children, ...rest }: CardProps) {
  const { palette } = useTheme();
  return (
    <View
      {...rest}
      style={[
        {
          backgroundColor: palette.card,
          borderColor: palette.border,
          borderWidth: 2,
          borderRadius: Radius.card,
          padding: Spacing.md,
        },
        style,
      ]}>
      {children}
    </View>
  );
}
