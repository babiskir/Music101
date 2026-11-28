/**
 * A rhythm is written as note lengths in beats; a negative length is a rest of that length:
 * [1, 1, -1, 1] = quarter, quarter, quarter rest, quarter.
 */
export interface PatternNote {
  /** Beats from the start of the pattern. */
  start: number;
  /** Length in beats (always positive). */
  beats: number;
  rest: boolean;
}

export function readPattern(lengths: number[]): PatternNote[] {
  let at = 0;
  return lengths.map((l) => {
    const n = { start: at, beats: Math.abs(l), rest: l < 0 };
    at += n.beats;
    return n;
  });
}

export const patternBeats = (lengths: number[]): number => lengths.reduce((sum, l) => sum + Math.abs(l), 0);

/** Only the notes you play (no rests). */
export const sounding = (pattern: PatternNote[]): PatternNote[] => pattern.filter((n) => !n.rest);

/** The shortest time between two notes you play, in beats (how strict the timing window must be). */
export function shortestGap(pattern: PatternNote[]): number {
  const played = sounding(pattern);
  if (played.length < 2) return played[0]?.beats ?? 1;
  let gap = Infinity;
  for (let i = 1; i < played.length; i++) gap = Math.min(gap, played[i].start - played[i - 1].start);
  return gap;
}
