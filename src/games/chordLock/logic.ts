import { comboBonus, starsFor, type Stars } from '../scoring';
import type { GameLevel } from '../types';

export type ChordName = 'C' | 'F' | 'G';

/** The three chords of the chords lesson, as the lowest note of each. */
export const CHORD_ROOTS: Record<ChordName, number> = { C: 60, F: 65, G: 67 };
export const CHORD_NAMES: ChordName[] = ['C', 'F', 'G'];
export const TONE_NAMES = ['root', 'middle', 'top'] as const;

/** Major triad: the root, then 4 and 7 semitones above (every other white key for C, F and G). */
export const chordNotes = (name: ChordName, octaveShift = 0): number[] => {
  const r = CHORD_ROOTS[name] + 12 * octaveShift;
  return [r, r + 4, r + 7];
};

/** Which tone of the chord (0 root, 1 middle, 2 top) a key is, in any octave; -1 if it is not in the chord. */
export function toneOf(name: ChordName, midi: number): number {
  return chordNotes(name).findIndex((n) => n % 12 === midi % 12);
}

export interface ChordLevel extends GameLevel {
  rounds: number;
  /** Seconds to complete each chord, or null for no limit. */
  timeS: number | null;
  /** The three keys of the chord are lit on the keyboard. */
  lit: boolean;
  /** Note names on the 3D keys. */
  names: boolean;
}

export const CHORD_LEVELS: ChordLevel[] = [
  { id: 'follow', title: 'Follow the lights', blurb: 'The keys are lit: build each chord, one note at a time.', rounds: 6, timeS: null, lit: true, names: true },
  { id: 'shape', title: 'Find the shape', blurb: 'No lights: skip a key between the notes.', rounds: 8, timeS: 20, lit: false, names: true },
  { id: 'fast', title: 'Quick change', blurb: 'No lights, no names, and the clock is ticking.', rounds: 10, timeS: 12, lit: false, names: false },
];

/** A run of chords, never the same one twice in a row. */
export function chordSequence(count: number, rng: () => number = Math.random): ChordName[] {
  const out: ChordName[] = [];
  for (let i = 0; i < count; i++) {
    const options = CHORD_NAMES.filter((c) => c !== out[i - 1]);
    out.push(options[Math.floor(rng() * options.length)]);
  }
  return out;
}

export type ChordPress =
  | { kind: 'new'; tone: number; complete: boolean; points: number }
  | { kind: 'again' }
  | { kind: 'wrong' };

/**
 * The rules of Chord Lock: a chord name appears; play its three notes in any order, in any octave
 * (broken chord). A wrong key is a slip; running out of time loses the chord. Time is passed in (seconds).
 */
export class ChordRound {
  index = 0;
  found: boolean[] = [false, false, false];
  score = 0;
  combo = 0;
  bestCombo = 0;
  clean = 0;
  slipped = 0;
  timedOut = 0;
  slips = 0;
  private slipsThisChord = 0;
  private startedAt = 0;

  constructor(readonly chords: ChordName[], readonly timeLimitS: number | null) {}

  get total(): number {
    return this.chords.length;
  }

  get current(): ChordName {
    return this.chords[Math.min(this.index, this.total - 1)];
  }

  get finished(): boolean {
    return this.index >= this.total;
  }

  start(now: number): void {
    this.startedAt = now;
  }

  /** Seconds left for this chord (null without a limit). */
  timeLeft(now: number): number | null {
    return this.timeLimitS === null ? null : Math.max(0, this.timeLimitS - (now - this.startedAt));
  }

  press(midi: number, now: number): ChordPress {
    if (this.finished) return { kind: 'again' };
    const tone = toneOf(this.current, midi);
    if (tone < 0) {
      this.slips++;
      this.slipsThisChord++;
      this.combo = 0;
      return { kind: 'wrong' };
    }
    if (this.found[tone]) return { kind: 'again' };
    this.found[tone] = true;
    if (!this.found.every(Boolean)) return { kind: 'new', tone, complete: false, points: 0 };

    const clean = this.slipsThisChord === 0;
    let points = clean ? 200 : 100;
    if (clean) {
      this.clean++;
      this.combo++;
      this.bestCombo = Math.max(this.bestCombo, this.combo);
      points += comboBonus(this.combo);
    } else {
      this.slipped++;
      this.combo = 0;
    }
    const left = this.timeLeft(now);
    if (left !== null && this.timeLimitS) points += Math.round((left / this.timeLimitS) * 50);
    this.score += points;
    this.nextChord(now);
    return { kind: 'new', tone, complete: true, points };
  }

  /** Call often: gives up on the chord when the time is over. Returns true when that just happened. */
  tick(now: number): boolean {
    if (this.finished || this.timeLimitS === null) return false;
    if (now - this.startedAt < this.timeLimitS) return false;
    this.timedOut++;
    this.combo = 0;
    this.nextChord(now);
    return true;
  }

  private nextChord(now: number): void {
    this.index++;
    this.found = [false, false, false];
    this.slipsThisChord = 0;
    this.startedAt = now;
  }

  /** Clean chords count in full, chords with slips for half, lost chords for nothing. */
  get accuracy(): number {
    return this.total === 0 ? 0 : (this.clean + 0.5 * this.slipped) / this.total;
  }

  get stars(): Stars {
    return starsFor(this.accuracy);
  }
}
