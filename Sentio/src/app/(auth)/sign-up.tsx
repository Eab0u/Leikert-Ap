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
import { Card } from '@/components/Card';
import { TextField } from '@/components/TextField';
import { Fonts, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { isUsernameTaken, signUp } from '@/lib/api';
import { errorMessage } from '@/lib/errors';

const USERNAME_RE = /^[A-Za-z0-9_]{3,20}$/;

export default function SignUpScreen() {
  const { palette } = useTheme();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [awaitingConfirmation, setAwaitingConfirmation] = useState(false);

  const handleSignUp = async () => {
    const trimmedUsername = username.trim();
    if (!USERNAME_RE.test(trimmedUsername)) {
      setError('Username must be 3-20 characters: letters, numbers, underscores.');
      return;
    }
    if (!email.trim()) {
      setError('Enter your email.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      if (await isUsernameTaken(trimmedUsername)) {
        setError('That username is taken. Try another one.');
        return;
      }
      const { needsEmailConfirmation } = await signUp(
        email.trim(),
        password,
        trimmedUsername
      );
      if (needsEmailConfirmation) {
        setAwaitingConfirmation(true);
      }
      // Otherwise AuthContext picks up the session and redirects to tabs.
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  if (awaitingConfirmation) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: palette.background }]}>
        <View style={styles.confirmWrap}>
          <Card style={styles.confirmCard}>
            <Text style={styles.confirmEmoji}>📬</Text>
            <Text style={[styles.confirmTitle, { color: palette.text }]}>
              Check your inbox
            </Text>
            <Text style={[styles.confirmBody, { color: palette.textMuted }]}>
              We sent a confirmation link to {email.trim()}. Confirm it, then
              sign in.
            </Text>
            <Button
              title="Back to sign in"
              onPress={() => router.replace('/(auth)/sign-in')}
            />
          </Card>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <Text style={styles.logo}>🌱</Text>
            <Text style={[styles.title, { color: palette.text }]}>
              Join Sentio
            </Text>
            <Text style={[styles.tagline, { color: palette.textMuted }]}>
              One rating a day keeps your friends in the loop.
            </Text>
          </View>

          <View style={styles.form}>
            <TextField
              label="Username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="sunny_sam"
            />
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
              autoComplete="new-password"
              placeholder="At least 6 characters"
            />
            {error ? (
              <Text style={[styles.error, { color: palette.danger }]}>{error}</Text>
            ) : null}
            <Button
              title="Create account"
              onPress={handleSignUp}
              loading={submitting}
            />
          </View>

          <Pressable onPress={() => router.back()} style={styles.switchRow}>
            <Text style={[styles.switchText, { color: palette.textMuted }]}>
              Already have an account?{' '}
              <Text style={{ color: palette.primary, fontFamily: Fonts.heading }}>
                Sign in
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
    fontSize: 32,
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
  confirmWrap: {
    flex: 1,
    justifyContent: 'center',
    padding: Spacing.lg,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  confirmCard: {
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
  },
  confirmEmoji: {
    fontSize: 44,
  },
  confirmTitle: {
    fontFamily: Fonts.heading,
    fontSize: 22,
  },
  confirmBody: {
    fontFamily: Fonts.body,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 21,
  },
});
