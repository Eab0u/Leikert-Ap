import { parseLocalDate } from '@/lib/dates';

const PROMPTS: readonly string[] = [
  'What is one thing that went well today?',
  'What made you smile today?',
  'What was the hardest part of your day?',
  'Who are you grateful for right now, and why?',
  'What is something you are looking forward to?',
  'What did you learn today?',
  'If today had a title, what would it be?',
  'What would you tell a friend who had the day you just had?',
  'What is one small win you want to remember?',
  'What drained your energy today, and what restored it?',
];

/** Rotates daily so the same date always shows the same prompt. */
export function promptForDate(dateStr: string): string {
  const dayNumber = Math.floor(parseLocalDate(dateStr).getTime() / 86_400_000);
  return PROMPTS[dayNumber % PROMPTS.length] as string;
}
