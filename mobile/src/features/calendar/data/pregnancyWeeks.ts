export type TrimesterId = 1 | 2 | 3;

export const trimesterRanges: Record<TrimesterId, { start: number; end: number }> = {
  1: { start: 1, end: 13 },
  2: { start: 14, end: 26 },
  3: { start: 27, end: 42 },
};
