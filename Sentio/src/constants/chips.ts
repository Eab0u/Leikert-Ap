export interface ChipDef {
  key: string;
  label: string;
  emoji: string;
}

export const CONTEXT_CHIPS: readonly ChipDef[] = [
  { key: 'work', label: 'Work', emoji: '💼' },
  { key: 'sleep', label: 'Sleep', emoji: '😴' },
  { key: 'friends', label: 'Friends', emoji: '🎉' },
  { key: 'family', label: 'Family', emoji: '🏡' },
  { key: 'exercise', label: 'Exercise', emoji: '💪' },
  { key: 'food', label: 'Food', emoji: '🍜' },
  { key: 'weather', label: 'Weather', emoji: '☀️' },
  { key: 'health', label: 'Health', emoji: '🩺' },
];

export function chipByKey(key: string): ChipDef | undefined {
  return CONTEXT_CHIPS.find((c) => c.key === key);
}
