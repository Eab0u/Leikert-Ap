import { router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { TextField } from '@/components/TextField';
import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { signIn } from '@/lib/api';
import { errorMessage } from '@/lib/errors';

export default function SignInScreen() {
  const { palette } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSignIn = async () => {
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await signIn(email.trim(), password);
      // AuthContext picks up the session and the layout redirects to tabs.
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <Text style={styles.logo}>☀️</Text>
            <Text style={[styles.title, { color: palette.text }]}>Sentio</Text>
            <Text style={[styles.tagline, { color: palette.textMuted }]}>
              Rate your day. Look out for your friends.
            </Text>
          </View>

          <View style={styles.form}>
            <TextField
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              placeholder="you@example.com"
            />
            <TextField
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="password"
              placeholder="Your password"
            />
            {error ? (
              <Text style={[styles.error, { color: palette.danger }]}>{error}</Text>
            ) : null}
            <Button title="Sign in" onPress={handleSignIn} loading={submitting} />
          </View>

          <Pressable
            onPress={() => router.push('/(auth)/sign-up')}
            style={styles.switchRow}>
            <Text style={[styles.switchText, { color: palette.textMuted }]}>
              New here?{' '}
              <Text style={{ color: palette.primary, fontFamily: Fonts.heading }}>
                Create an account
              </Text>
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
    gap: Spacing.xl,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  hero: {
    alignItems: 'center',
    gap: Spacing.sm,
  },
  logo: {
    fontSize: 56,
  },
  title: {
    fontFamily: Fonts.heading,
    fontSize: 36,
  },
  tagline: {
    fontFamily: Fonts.body,
    fontSize: 15,
    textAlign: 'center',
  },
  form: {
    gap: Spacing.md,
  },
  error: {
    fontFamily: Fonts.body,
    fontSize: 14,
    textAlign: 'center',
  },
  switchRow: {
    alignItems: 'center',
    minHeight: 48,
    justifyContent: 'center',
  },
  switchText: {
    fontFamily: Fonts.body,
    fontSize: 15,
  },
});
