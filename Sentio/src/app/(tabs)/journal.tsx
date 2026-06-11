import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { EmptyState } from '@/components/EmptyState';
import { Fonts, Radius, Spacing } from '@/constants/theme';
import { useRequiredUserId } from '@/context/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { getJournalEntries, upsertJournalEntry } from '@/lib/api';
import { formatDisplayDate, todayLocalDate } from '@/lib/dates';
import { errorMessage } from '@/lib/errors';
import { promptForDate } from '@/lib/prompts';
import type { JournalEntry } from '@/lib/types';

export default function JournalScreen() {
  const userId = useRequiredUserId();
  const { palette } = useTheme();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [body, setBody] = useState('');
  const [savedBody, setSavedBody] = useState('');
  const [saving, setSaving] = useState(false);

  const today = todayLocalDate();

  const load = useCallback(async () => {
    try {
      setError(null);
      const all = await getJournalEntries(userId);
      setEntries(all);
      const todayEntry = all.find((e) => e.date === today);
      const existing = todayEntry?.body ?? '';
      setSavedBody(existing);
      // Don't clobber unsaved typing on refocus.
      setBody((current) => (current === '' ? existing : current));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [userId, today]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      const saved = await upsertJournalEntry(userId, today, body);
      setSavedBody(saved.body);
      setEntries((prev) => {
        const others = prev.filter((e) => e.date !== today);
        return [saved, ...others].sort((a, b) => b.date.localeCompare(a.date));
      });
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const pastEntries = entries.filter((e) => e.date !== today && e.body.trim() !== '');
  const dirty = body !== savedBody;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <Text style={[styles.title, { color: palette.text }]}>Journal</Text>
            <View style={styles.privacyRow}>
              <Text style={styles.lock}>🔒</Text>
              <Text style={[styles.privacyText, { color: palette.textMuted }]}>
                Only you can ever see this.
              </Text>
            </View>
          </View>

          {error ? (
            <Card style={{ borderColor: palette.danger }}>
              <Text style={[styles.errorText, { color: palette.danger }]}>{error}</Text>
            </Card>
          ) : null}

          <Card style={styles.promptCard}>
            <Text style={[styles.promptLabel, { color: palette.textMuted }]}>
              💡 Today&apos;s prompt (optional)
            </Text>
            <Text style={[styles.promptText, { color: palette.text }]}>
              {promptForDate(today)}
            </Text>
          </Card>

          <View style={styles.editorSection}>
            <Text style={[styles.sectionTitle, { color: palette.text }]}>
              {formatDisplayDate(today)}
            </Text>
            <TextInput
              value={body}
              onChangeText={setBody}
              multiline
              textAlignVertical="top"
              placeholder="Write anything. It stays between you and this page."
              placeholderTextColor={palette.textMuted}
              style={[
                styles.editor,
                {
                  backgroundColor: palette.inputBackground,
                  borderColor: palette.border,
                  color: palette.text,
                },
              ]}
            />
            <Button
              title={saving ? 'Saving' : 'Save entry'}
              onPress={() => void save()}
              disabled={!dirty}
              loading={saving}
            />
          </View>

          <View style={styles.pastSection}>
            <Text style={[styles.sectionTitle, { color: palette.text }]}>
              Past entries
            </Text>
            {loading ? (
              <ActivityIndicator color={palette.primary} />
            ) : pastEntries.length === 0 ? (
              <EmptyState
                emoji="📖"
                title="A fresh page"
                message="Your past entries will show up here. Tomorrow-you will love reading them."
              />
            ) : (
              pastEntries.map((entry) => (
                <Card key={entry.id} style={styles.entryCard}>
                  <Text style={[styles.entryDate, { color: palette.primary }]}>
                    {formatDisplayDate(entry.date)}
                  </Text>
                  <Text style={[styles.entryBody, { color: palette.text }]}>
                    {entry.body}
                  </Text>
                </Card>
              ))
            )}
          </View>
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
    padding: Spacing.lg,
    gap: Spacing.lg,
    maxWidth: 560,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    gap: Spacing.xs,
  },
  title: {
    fontFamily: Fonts.heading,
    fontSize: 30,
  },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lock: {
    fontSize: 13,
  },
  privacyText: {
    fontFamily: Fonts.label,
    fontSize: 13,
  },
  errorText: {
    fontFamily: Fonts.body,
    fontSize: 14,
    textAlign: 'center',
  },
  promptCard: {
    gap: Spacing.xs,
  },
  promptLabel: {
    fontFamily: Fonts.label,
    fontSize: 13,
  },
  promptText: {
    fontFamily: Fonts.heading,
    fontSize: 17,
    lineHeight: 24,
  },
  editorSection: {
    gap: Spacing.sm + 4,
  },
  sectionTitle: {
    fontFamily: Fonts.heading,
    fontSize: 18,
  },
  editor: {
    borderWidth: 2,
    borderRadius: Radius.input,
    padding: 14,
    minHeight: 140,
    fontFamily: Fonts.body,
    fontSize: 16,
    lineHeight: 23,
  },
  pastSection: {
    gap: Spacing.sm + 4,
  },
  entryCard: {
    gap: Spacing.sm,
  },
  entryDate: {
    fontFamily: Fonts.heading,
    fontSize: 14,
  },
  entryBody: {
    fontFamily: Fonts.body,
    fontSize: 15,
    lineHeight: 22,
  },
});
