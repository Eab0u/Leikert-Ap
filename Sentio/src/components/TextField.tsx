import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';

interface TextFieldProps extends TextInputProps {
  label?: string;
  error?: string | null;
}

export function TextField({ label, error, style, ...rest }: TextFieldProps) {
  const { palette } = useTheme();
  return (
    <View style={styles.container}>
      {label ? (
        <Text style={[styles.label, { color: palette.text }]}>{label}</Text>
      ) : null}
      <TextInput
        placeholderTextColor={palette.textMuted}
        {...rest}
        style={[
          styles.input,
          {
            backgroundColor: palette.inputBackground,
            borderColor: error ? palette.danger : palette.border,
            color: palette.text,
          },
          style,
        ]}
      />
      {error ? (
        <Text style={[styles.error, { color: palette.danger }]}>{error}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing.xs,
  },
  label: {
    fontFamily: Fonts.label,
    fontSize: 14,
  },
  input: {
    borderWidth: 2,
    borderRadius: Radius.input,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 48,
    fontFamily: Fonts.body,
    fontSize: 16,
  },
  error: {
    fontFamily: Fonts.body,
    fontSize: 13,
  },
});
