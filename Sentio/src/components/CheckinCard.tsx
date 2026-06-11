import { StyleSheet, Text, View } from 'react-native';

import { Card } from '@/components/Card';
import { chipByKey } from '@/constants/chips';
import { Fonts, ratingColor, ratingLabel, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/useTheme';
import { relativeTime } from '@/lib/dates';
import type { FeedItem } from '@/lib/types';

interface CheckinCardProps {
  item: FeedItem;
}

/**
 * A friend's check-in. Ratings of 1-3 get prominent treatment and a
 * "Check in on them" nudge.
 */
export function CheckinCard({ item }: CheckinCardProps) {
  const { palette } = useTheme();
  const { checkin, username } = item;
  const lowRating = checkin.rating <= 3;
  const color = ratingColor(checkin.rating);

  return (
    <Card style={lowRating ? { borderColor: palette.primary } : undefined}>
      <View style={styles.headerRow}>
        <Text style={[styles.username, { color: palette.text }]}>{username}</Text>
        <Text style={[styles.time, { color: palette.textMuted }]}>
          {relativeTime(checkin.created_at)}
        </Text>
      </View>

      <View style={styles.ratingRow}>
        <View style={[styles.ratingBadge, { backgroundColor: color }]}>
          <Text
            style={[
              styles.ratingNumber,
              { color: checkin.rating >= 3 && checkin.rating <= 5 ? '#3C3C3C' : '#FFFFFF' },
            ]}>
            {checkin.rating}
          </Text>
        </View>
        <Text style={[styles.ratingLabel, { color }]}>
          {ratingLabel(checkin.rating)}
        </Text>
      </View>

      {checkin.chips.length > 0 ? (
        <Text style={[styles.chips, { color: palette.textMuted }]}>
          {checkin.chips
            .map((key) => {
              const chip = chipByKey(key);
              return chip ? `${chip.emoji} ${chip.label}` : key;
            })
            .join('   ')}
        </Text>
      ) : null}

      {lowRating ? (
        <Text style={[styles.nudge, { color: palette.primary }]}>
          💛 Check in on them
        </Text>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  username: {
    fontFamily: Fonts.heading,
    fontSize: 16,
  },
  time: {
    fontFamily: Fonts.body,
    fontSize: 13,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm + 4,
    marginTop: Spacing.sm + 4,
  },
  ratingBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ratingNumber: {
    fontFamily: Fonts.heading,
    fontSize: 20,
  },
  ratingLabel: {
    fontFamily: Fonts.heading,
    fontSize: 18,
  },
  chips: {
    fontFamily: Fonts.body,
    fontSize: 13,
    marginTop: Spacing.sm + 4,
    lineHeight: 20,
  },
  nudge: {
    fontFamily: Fonts.heading,
    fontSize: 15,
    marginTop: Spacing.sm + 4,
  },
});
