import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Animated, { ZoomIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { RatingSelector } from '@/components/RatingSelector';
import { StreakFlame } from '@/components/StreakFlame';
import { CONTEXT_CHIPS } from '@/constants/chips';
import { Fonts, ratingColor, ratingLabel, Spacing } from '@/constants/theme';
import { useAuth, useRequiredUserId } from '@/context/AuthContext';
import { useTheme } from '@/hooks/useTheme';
import { getCheckin, getMyCheckins, upsertCheckin } from '@/lib/api';
import { formatDisplayDate, todayLocalDate } from '@/lib/dates';
import { errorMessage } from '@/lib/errors';
import { currentStreak } from '@/lib/streaks';
import type { Checkin, Rating } from '@/lib/types';

export default function TodayScreen() {
  const userId = useRequiredUserId();
  const { profile } = useAuth();
  const { palette } = useTheme();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [todayCheckin, setTodayCheckin] = useState<Checkin | null>(null);
  const [checkinDates, setCheckinDates] = useState<string[]>([]);
  const [editing, setEditing] = useState(false);
  const [rating, setRating] = useState<Rating | null>(null);
  const [chips, setChips] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const today = todayLocalDate();
      const [checkin, mine] = await Promise.all([
        getCheckin(userId, today),
        getMyCheckins(userId),
      ]);
      setTodayCheckin(checkin);
      setCheckinDates(mine.map((c) => c.date));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load])
  );

  const toggleChip = (key: string) => {
    setChips((prev) =>
      prev.includes(key) ? prev.filter((c) => c !== key) : [...prev, key]
    );
  };

  const startEditing = () => {
    if (todayCheckin) {
      setRating(todayCheckin.rating);
      setChips(todayCheckin.chips);
    }
    setJustSubmitted(false);
    setEditing(true);
  };

  const submit = async () => {
    if (!rating) return;
    setSubmitting(true);
    setError(null);
    try {
      const saved = await upsertCheckin(userId, todayLocalDate(), rating, chips);
      setTodayCheckin(saved);
      setCheckinDates((prev) =>
        prev.includes(saved.date) ? prev : [...prev, saved.date]
      );
      setEditing(false);
      setJustSubmitted(true);
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setSubmitting(false);
    }
  };

  const streak = currentStreak(checkinDates);
  const today = todayLocalDate();
  const showForm = !loading && (editing || todayCheckin === null);
  const showSummary = !loading && !editing && todayCheckin !== null;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: palette.text }]}>Today</Text>
          <Text style={[styles.subtitle, { color: palette.textMuted }]}>
            {formatDisplayDate(today)}
            {profile ? ` · Hey, ${profile.username}! 👋` : ''}
          </Text>
        </View>

        {loading ? (
          <ActivityIndicator color={palette.primary} style={styles.loader} />
        ) : null}

        {error ? (
          <Card style={{ borderColor: palette.danger }}>
            <Text style={[styles.errorText, { color: palette.danger }]}>{error}</Text>
            <Button title="Try again" variant="outline" onPress={() => void load()} />
          </Card>
        ) : null}

        {showForm ? (
          <View style={styles.form}>
            <RatingSelector value={rating} onSelect={setRating} />

            <View style={styles.chipSection}>
              <Text style={[styles.sectionLabel, { color: palette.text }]}>
                What shaped your day?
              </Text>
              <View style={styles.chipRow}>
                {CONTEXT_CHIPS.map((chip) => (
                  <Chip
                    key={chip.key}
                    label={chip.label}
                    emoji={chip.emoji}
                    selected={chips.includes(chip.key)}
                    onToggle={() => toggleChip(chip.key)}
                  />
                ))}
              </View>
            </View>

            <Button
              title={editing ? 'Save changes' : 'Check in'}
              onPress={() => void submit()}
              disabled={rating === null}
              loading={submitting}
            />
            {editing ? (
              <Button
                title="Cancel"
                variant="outline"
                onPress={() => setEditing(false)}
              />
            ) : null}
          </View>
        ) : null}

        {showSummary && todayCheckin ? (
          <Animated.View
            key={justSubmitted ? 'celebrate' : 'calm'}
            entering={justSubmitted ? ZoomIn.springify().damping(12) : undefined}
            style={styles.summary}>
            <Card style={styles.summaryCard}>
              <Text style={[styles.summaryHeading, { color: palette.textMuted }]}>
                {justSubmitted ? 'Nice! Day rated 🎉' : "Today's check-in"}
              </Text>
              <View
                style={[
                  styles.bigBadge,
                  { backgroundColor: ratingColor(todayCheckin.rating) },
                ]}>
                <Text
                  style={[
                    styles.bigBadgeNumber,
                    {
                      color:
                        todayCheckin.rating >= 3 && todayCheckin.rating <= 5
                          ? '#3C3C3C'
                          : '#FFFFFF',
                    },
                  ]}>
                  {todayCheckin.rating}
                </Text>
              </View>
              <Text
                style={[
                  styles.summaryLabel,
                  { color: ratingColor(todayCheckin.rating) },
                ]}>
                {ratingLabel(todayCheckin.rating)}
              </Text>

              {todayCheckin.chips.length > 0 ? (
                <View style={styles.chipRowCentered}>
                  {todayCheckin.chips.map((key) => {
                    const chip = CONTEXT_CHIPS.find((c) => c.key === key);
                    return chip ? (
                      <Chip
                        key={key}
                        label={chip.label}
                        emoji={chip.emoji}
                        selected
                      />
                    ) : null;
                  })}
                </View>
              ) : null}

              <StreakFlame count={streak} />
            </Card>

            <Button
              title="Write in journal"
              onPress={() => router.push('/(tabs)/journal')}
            />
            <Button title="Edit today's check-in" variant="outline" onPress={startEditing} />
            <Text style={[styles.editHint, { color: palette.textMuted }]}>
              You can edit until midnight.
            </Text>
          </Animated.View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
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
    gap: 2,
  },
  title: {
    fontFamily: Fonts.heading,
    fontSize: 30,
  },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: 15,
  },
  loader: {
    marginTop: Spacing.xl,
  },
  errorText: {
    fontFamily: Fonts.body,
    fontSize: 14,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  form: {
    gap: Spacing.lg,
  },
  chipSection: {
    gap: Spacing.sm + 4,
  },
  sectionLabel: {
    fontFamily: Fonts.label,
    fontSize: 16,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chipRowCentered: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    justifyContent: 'center',
  },
  summary: {
    gap: Spacing.md,
  },
  summaryCard: {
    alignItems: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
  },
  summaryHeading: {
    fontFamily: Fonts.label,
    fontSize: 15,
  },
  bigBadge: {
    width: 88,
    height: 88,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigBadgeNumber: {
    fontFamily: Fonts.heading,
    fontSize: 40,
  },
  summaryLabel: {
    fontFamily: Fonts.heading,
    fontSize: 26,
  },
  editHint: {
    fontFamily: Fonts.body,
    fontSize: 13,
    textAlign: 'center',
  },
});
