import { addDays, todayLocalDate } from '@/lib/dates';

/**
 * Current streak: consecutive checked-in days ending today, or ending
 * yesterday if today hasn't been checked in yet (the streak isn't broken
 * until midnight passes without a check-in).
 */
export function currentStreak(checkinDates: readonly string[]): number {
  const set = new Set(checkinDates);
  const today = todayLocalDate();
  let cursor = set.has(today) ? today : addDays(today, -1);
  let streak = 0;
  while (set.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function longestStreak(checkinDates: readonly string[]): number {
  const sorted = [...new Set(checkinDates)].sort();
  let best = 0;
  let run = 0;
  let prev: string | null = null;
  for (const date of sorted) {
    run = prev !== null && addDays(prev, 1) === date ? run + 1 : 1;
    best = Math.max(best, run);
    prev = date;
  }
  return best;
}
