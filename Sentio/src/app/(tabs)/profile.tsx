import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Card } from '@/components/Card';
import { Chip } from '@/components/Chip';
import { Fonts, Spacing } from '@/constants/theme';
import { useAuth, useRequiredUserId } from '@/context/AuthContext';
import { type AppearanceMode } from '@/context/ThemeContext';
import { useTheme } from '@/hooks/useTheme';
import { getMyCheckins, signOut } from '@/lib/api';
import { addDays, todayLocalDate } from '@/lib/dates';
import { errorMessage } from '@/lib/errors';
import {
  DEFAULT_REMINDER,
  disableDailyReminder,
  enableDailyReminder,
  getReminderSettings,
  remindersSupported,
  type ReminderSettings,
} from '@/lib/notifications';
import { longestStreak } from '@/lib/streaks';
import type { Checkin } from '@/lib/types';

const APPEARANCE_OPTIONS: { mode: AppearanceMode; label: string; emoji: string }[] = [
  { mode: 'system', label: 'System', emoji: '📱' },
  { mode: 'light', label: 'Light', emoji: '☀️' },
  { mode: 'dark', label: 'Dark', emoji: '🌙' },
];

function pad(n: number): string {
  return n.toString().padStart(2, '0');
}

interface StepperProps {
  value: string;
  onDecrement: () => void;
  onIncrement: () => void;
}

function Stepper({ value, onDecrement, onIncrement }: StepperProps) {
  const { palette } = useTheme();
  const buttonStyle = {
    backgroundColor: palette.card,
    borderColor: palette.border,
  };
  return (
    <View style={styles.stepper}>
      <Pressable
        accessibilityRole="button"
        onPress={onDecrement}
        style={[styles.stepButton, buttonStyle]}>
        <Text style={[styles.stepButtonText, { color: palette.text }]}>−</Text>
      </Pressable>
      <Text style={[styles.stepValue, { color: palette.text }]}>{value}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={onIncrement}
        style={[styles.stepButton, buttonStyle]}>
        <Text style={[styles.stepButtonText, { color: palette.text }]}>+</Text>
      </Pressable>
    </View>
  );
}

export default function ProfileScreen() {
  const userId = useRequiredUserId();
  const { session, profile } = useAuth();
  const { palette, mode, setMode } = useTheme();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [chartWidth, setChartWidth] = useState(0);

  const [reminder, setReminder] = useState<ReminderSettings>(DEFAULT_REMINDER);
  const [reminderError, setReminderError] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      setCheckins(await getMyCheckins(userId));
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

  useEffect(() => {
    getReminderSettings().then(setReminder).catch(() => undefined);
  }, []);

  const applyReminder = async (next: ReminderSettings) => {
    setReminder(next);
    setReminderError(null);
    try {
      if (next.enabled) {
        const granted = await enableDailyReminder(next.hour, next.minute);
        if (!granted) {
          setReminder({ ...next, enabled: false });
          setReminderError(
            'Notification permission was denied. Enable it in system settings.'
          );
        }
      } else {
        await disableDailyReminder();
      }
    } catch (e) {
      setReminderError(errorMessage(e));
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    setError(null);
    try {
      await signOut();
    } catch (e) {
      setError(errorMessage(e));
      setSigningOut(false);
    }
  };

  // History: last 30 days for the chart, all-time for the stats.
  const cutoff = addDays(todayLocalDate(), -29);
  const last30 = checkins.filter((c) => c.date >= cutoff);
  const chartData = last30.map((c, index) => ({
    value: c.rating,
    label:
      index % 5 === 0 || index === last30.length - 1
        ? `${parseInt(c.date.slice(8), 10)}`
        : '',
  }));
  const average =
    checkins.length > 0
      ? checkins.reduce((sum, c) => sum + c.rating, 0) / checkins.length
      : null;
  const longest = longestStreak(checkins.map((c) => c.date));

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: palette.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: palette.text }]}>
            {profile?.username ?? 'Profile'}
          </Text>
          <Text style={[styles.subtitle, { color: palette.textMuted }]}>
            {session?.user.email ?? ''}
          </Text>
        </View>

        {error ? (
          <Card style={{ borderColor: palette.danger }}>
            <Text style={[styles.errorText, { color: palette.danger }]}>{error}</Text>
          </Card>
        ) : null}

        <Card
          style={styles.sectionCard}
          onLayout={(e) => setChartWidth(e.nativeEvent.layout.width)}>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>
            📈 Your last 30 days
          </Text>
          {loading ? (
            <ActivityIndicator color={palette.primary} />
          ) : chartData.length < 2 ? (
            <Text style={[styles.muted, { color: palette.textMuted }]}>
              Check in for a couple of days and your chart will grow here.
            </Text>
          ) : chartWidth > 0 ? (
            <LineChart
              data={chartData}
              width={Math.max(chartWidth - 90, 100)}
              adjustToWidth
              maxValue={7}
              noOfSections={7}
              stepValue={1}
              curved
              thickness={3}
              color={palette.primary}
              dataPointsColor={palette.primary}
              hideDataPoints={chartData.length > 20}
              yAxisColor="transparent"
              xAxisColor={palette.border}
              rulesColor={palette.border}
              rulesType="solid"
              yAxisTextStyle={{
                color: palette.textMuted,
                fontFamily: Fonts.body,
                fontSize: 11,
              }}
              xAxisLabelTextStyle={{
                color: palette.textMuted,
                fontFamily: Fonts.body,
                fontSize: 10,
              }}
              disableScroll
            />
          ) : null}

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: palette.text }]}>
                {average !== null ? average.toFixed(1) : '–'}
              </Text>
              <Text style={[styles.statLabel, { color: palette.textMuted }]}>
                All-time avg
              </Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: palette.text }]}>
                {longest} 🔥
              </Text>
              <Text style={[styles.statLabel, { color: palette.textMuted }]}>
                Longest streak
              </Text>
            </View>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: palette.text }]}>
                {checkins.length}
              </Text>
              <Text style={[styles.statLabel, { color: palette.textMuted }]}>
                Check-ins
              </Text>
            </View>
          </View>
        </Card>

        <Card style={styles.sectionCard}>
          <View style={styles.reminderHeader}>
            <Text style={[styles.sectionTitle, { color: palette.text }]}>
              ⏰ Daily reminder
            </Text>
            <Switch
              value={reminder.enabled}
              disabled={!remindersSupported}
              onValueChange={(enabled) => void applyReminder({ ...reminder, enabled })}
              trackColor={{ true: palette.primary, false: palette.border }}
              thumbColor="#FFFFFF"
            />
          </View>
          {remindersSupported ? (
            <>
              <Text style={[styles.muted, { color: palette.textMuted }]}>
                &quot;Time to rate your day!&quot; — every day at:
              </Text>
              <View style={styles.timeRow}>
                <Stepper
                  value={pad(reminder.hour)}
                  onDecrement={() =>
                    void applyReminder({
                      ...reminder,
                      hour: (reminder.hour + 23) % 24,
                    })
                  }
                  onIncrement={() =>
                    void applyReminder({
                      ...reminder,
                      hour: (reminder.hour + 1) % 24,
                    })
                  }
                />
                <Text style={[styles.timeColon, { color: palette.text }]}>:</Text>
                <Stepper
                  value={pad(reminder.minute)}
                  onDecrement={() =>
                    void applyReminder({
                      ...reminder,
                      minute: (reminder.minute + 55) % 60,
                    })
                  }
                  onIncrement={() =>
                    void applyReminder({
                      ...reminder,
                      minute: (reminder.minute + 5) % 60,
                    })
                  }
                />
              </View>
            </>
          ) : (
            <Text style={[styles.muted, { color: palette.textMuted }]}>
              Reminders are available on iOS and Android.
            </Text>
          )}
          {reminderError ? (
            <Text style={[styles.errorText, { color: palette.danger }]}>
              {reminderError}
            </Text>
          ) : null}
        </Card>

        <Card style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { color: palette.text }]}>
            🎨 Appearance
          </Text>
          <View style={styles.appearanceRow}>
            {APPEARANCE_OPTIONS.map((option) => (
              <Chip
                key={option.mode}
                label={option.label}
                emoji={option.emoji}
                selected={mode === option.mode}
                onToggle={() => setMode(option.mode)}
              />
            ))}
          </View>
        </Card>

        <Button
          title="Sign out"
          variant="outline"
          onPress={() => void handleSignOut()}
          loading={signingOut}
        />
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
    fontSize: 14,
  },
  errorText: {
    fontFamily: Fonts.body,
    fontSize: 14,
    textAlign: 'center',
  },
  sectionCard: {
    gap: Spacing.md,
  },
  sectionTitle: {
    fontFamily: Fonts.heading,
    fontSize: 18,
  },
  muted: {
    fontFamily: Fonts.body,
    fontSize: 14,
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  stat: {
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontFamily: Fonts.heading,
    fontSize: 22,
  },
  statLabel: {
    fontFamily: Fonts.body,
    fontSize: 12,
  },
  reminderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
  },
  timeColon: {
    fontFamily: Fonts.heading,
    fontSize: 24,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  stepButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepButtonText: {
    fontFamily: Fonts.heading,
    fontSize: 20,
  },
  stepValue: {
    fontFamily: Fonts.heading,
    fontSize: 24,
    minWidth: 38,
    textAlign: 'center',
  },
  appearanceRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
});
