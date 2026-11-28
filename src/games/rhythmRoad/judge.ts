import { comboBonus, starsFor, type Stars } from '../scoring';
import type { GameLevel } from '../types';

export type Grade = 'perfect' | 'good' | 'miss';

export interface RhythmLevel extends GameLevel {
  bpm: number;
  /** Bars of note lengths, in beats (4 beats a bar). Played one after the other. */
  patterns: number[][];
}

export const RHYTHM_LEVELS: RhythmLevel[] = [
  {
    id: 'quarters', title: 'Steady beats', blurb: 'Quarter notes, one per click.', bpm: 60,
    patterns: [[1, 1, 1, 1], [1, 1, 1, 1], [1, 1, 1, 1], [1, 1, 1, 1]],
  },
  {
    id: 'long-short', title: 'Long and short', blurb: 'Quarter and half notes: hold the long ones.', bpm: 66,
    patterns: [[1, 1, 2], [2, 1, 1], [2, 2], [1, 1, 1, 1], [1, 1, 2], [4]],
  },
  {
    id: 'eighths', title: 'Eighth notes', blurb: 'Two notes per click: "1 and 2 and...".', bpm: 72,
    patterns: [[0.5, 0.5, 0.5, 0.5, 1, 1], [1, 0.5, 0.5, 1, 1], [0.5, 0.5, 1, 0.5, 0.5, 1], [0.5, 0.5, 0.5, 0.5, 0.5, 0.5, 1], [2, 1, 0.5, 0.5]],
  },
  {
    id: 'mix', title: 'Full speed mix', blurb: 'Everything together, a little faster.', bpm: 84,
    patterns: [[1, 1, 2], [0.5, 0.5, 0.5, 0.5, 1, 1], [2, 1, 0.5, 0.5], [1, 0.5, 0.5, 2], [0.5, 0.5, 1, 1, 1], [1, 1, 1, 1], [0.5, 0.5, 0.5, 0.5, 2], [4]],
  },
];

export interface Timeline {
  /** Start of each note, in beats from the first one. */
  starts: number[];
  /** Length of each note, in beats. */
  lengths: number[];
  totalBeats: number;
}

/** Lay the bars end to end. */
export function buildTimeline(patterns: number[][]): Timeline {
  const starts: number[] = [];
  const lengths: number[] = [];
  let at = 0;
  for (const bar of patterns) {
    for (const b of bar) {
      starts.push(at);
      lengths.push(b);
      at += b;
    }
  }
  return { starts, lengths, totalBeats: at };
}

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};

export interface Hit {
  /** Which note of the pattern this key press was for. */
  index: number;
  grade: Grade;
  /** Milliseconds early (negative) or late (positive), after allowing for the player's steady delay. */
  errorMs: number;
}

const OFFSET_LIMITS: [number, number] = [-120, 400];
const OFFSET_WINDOW = 5;
const OFFSET_MIN_HITS = 3;

/**
 * Judges key presses against the moments the notes should sound. Like the lesson's grading it measures
 * steadiness, not absolute lateness: a microphone hears a note 100 to 200 ms after it was played, so the
 * judge learns the player's usual delay (the median of their last few hits) and measures from there.
 * Pure: time is always passed in.
 */
export class RhythmJudge {
  readonly goodMs: number;
  readonly perfectMs: number;
  readonly grades: (Grade | null)[];
  readonly hits: Hit[] = [];
  offsetMs: number;
  private raw: number[] = [];

  /**
   * @param expectedMs when each note should sound
   * @param spbMs milliseconds per beat
   * @param minGapBeats the shortest note: the windows shrink so that neighbouring notes never overlap
   * @param initialOffsetMs the delay to expect before anything has been learned (about 120 for a microphone)
   */
  constructor(readonly expectedMs: number[], spbMs: number, minGapBeats: number, initialOffsetMs = 0) {
    this.goodMs = Math.max(110, Math.min(180, 0.45 * minGapBeats * spbMs));
    this.perfectMs = Math.max(50, this.goodMs * 0.45);
    this.grades = expectedMs.map(() => null);
    this.offsetMs = initialOffsetMs;
  }

  /** Notes whose window has closed without a key press are misses. Returns the new ones. */
  sweep(nowMs: number): number[] {
    const out: number[] = [];
    this.expectedMs.forEach((t, i) => {
      if (this.grades[i] === null && nowMs - this.offsetMs > t + this.goodMs) {
        this.grades[i] = 'miss';
        out.push(i);
      }
    });
    return out;
  }

  /** A key press at `timeMs`. Null when it is not close to any note that is still waiting (a stray key). */
  press(timeMs: number): Hit | null {
    this.sweep(timeMs);
    const adjusted = timeMs - this.offsetMs;
    const i = this.expectedMs.findIndex((t, k) => this.grades[k] === null && adjusted <= t + this.goodMs);
    if (i < 0) return null;
    const errorMs = adjusted - this.expectedMs[i];
    if (Math.abs(errorMs) > this.goodMs) return null; // too early for the next note
    const grade: Grade = Math.abs(errorMs) <= this.perfectMs ? 'perfect' : 'good';
    this.grades[i] = grade;
    this.learn(timeMs - this.expectedMs[i]);
    const hit = { index: i, grade, errorMs };
    this.hits.push(hit);
    return hit;
  }

  private learn(rawErrorMs: number): void {
    this.raw.push(rawErrorMs);
    if (this.raw.length < OFFSET_MIN_HITS) return;
    const m = median(this.raw.slice(-OFFSET_WINDOW));
    this.offsetMs = Math.min(OFFSET_LIMITS[1], Math.max(OFFSET_LIMITS[0], m));
  }

  get resolved(): number {
    return this.grades.filter((g) => g !== null).length;
  }

  count(grade: Grade): number {
    return this.grades.filter((g) => g === grade).length;
  }

  /** Share of the notes played on the beat: perfect in full, good for 60 %. */
  get accuracy(): number {
    return this.grades.length === 0 ? 0 : (this.count('perfect') + 0.6 * this.count('good')) / this.grades.length;
  }

  get stars(): Stars {
    return starsFor(this.accuracy);
  }
}

/** Points for one graded note, given the streak so far (the new hit included). */
export function hitPoints(grade: Grade, combo: number): number {
  if (grade === 'miss') return 0;
  return (grade === 'perfect' ? 100 : 60) + comboBonus(combo);
}
