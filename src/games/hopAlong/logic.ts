import { isBlackKey } from '../../domain/notes';
import { whiteKeys } from '../../guide/targets';
import { comboBonus, starsFor, type Stars } from '../scoring';
import type { GameLevel } from '../types';

/** Every white key from middle C to the G above the next C: the frog's pond. */
export const POND = whiteKeys(60, 79);
export const POND_RANGE: [number, number] = [60, 79];

export type MoveKind = 'repeat' | 'step' | 'skip' | 'leap';

export interface Move {
  kind: MoveKind;
  /** +1 up the keyboard, -1 down, 0 for a repeated key. */
  dir: 1 | -1 | 0;
}

export interface HopLevel extends GameLevel {
  kinds: MoveKind[];
  hops: number;
  /** Light up where the frog may land. Otherwise only after a pause. */
  showTargets: boolean;
  names: boolean;
}

export const HOP_LEVELS: HopLevel[] = [
  { id: 'steps', title: 'Steps', blurb: 'Hop to the very next white key, up or down.', kinds: ['step', 'repeat'], hops: 8, showTargets: true, names: true },
  { id: 'skips', title: 'Steps and skips', blurb: 'Now some hops skip over one key.', kinds: ['step', 'skip'], hops: 10, showTargets: false, names: true },
  { id: 'leaps', title: 'Steps, skips and leaps', blurb: 'Big jumps too: anything three keys or more.', kinds: ['step', 'skip', 'leap', 'repeat'], hops: 12, showTargets: false, names: true },
  { id: 'blind', title: 'No names', blurb: 'Same, with the key names hidden. Count the keys.', kinds: ['step', 'skip', 'leap', 'repeat'], hops: 14, showTargets: false, names: false },
];

/** "A step up", "A skip down", "The same key again". */
export function moveText(m: Move): string {
  if (m.kind === 'repeat') return 'The same key again';
  const noun = m.kind === 'step' ? 'A step' : m.kind === 'skip' ? 'A skip' : 'A leap';
  return `${noun} ${m.dir > 0 ? 'up' : 'down'}`;
}

/** What the prompt means in words a beginner can act on. */
export function moveHelp(m: Move): string {
  switch (m.kind) {
    case 'repeat': return 'Play the key the frog is sitting on.';
    case 'step': return 'The very next white key.';
    case 'skip': return 'Jump over one white key.';
    case 'leap': return 'Three white keys away or more.';
  }
}

/** Is a hop from white-key position `from` to `to` (positions in POND) what the prompt asked for? */
export function isMove(move: Move, from: number, to: number): boolean {
  const d = to - from;
  switch (move.kind) {
    case 'repeat': return d === 0;
    case 'step': return d === move.dir;
    case 'skip': return d === 2 * move.dir;
    case 'leap': return Math.abs(d) >= 3 && Math.sign(d) === move.dir;
  }
}

/** Positions the frog may land on for this prompt. */
export function landings(move: Move, from: number): number[] {
  return POND.map((_, i) => i).filter((i) => isMove(move, from, i));
}

/** A random move that has at least one landing from `from`. */
export function pickMove(from: number, kinds: MoveKind[], rng: () => number = Math.random): Move {
  const all: Move[] = kinds.flatMap((kind): Move[] =>
    kind === 'repeat' ? [{ kind, dir: 0 }] : [{ kind, dir: 1 }, { kind, dir: -1 }],
  );
  const possible = all.filter((m) => landings(m, from).length > 0);
  return possible[Math.floor(rng() * possible.length)];
}

export type HopPress =
  | { kind: 'right'; to: number; points: number; clean: boolean }
  | { kind: 'wrong'; reason: string };

/**
 * The rules of Hop Along: a frog sits on a white key and is told how to move: a step, a skip, a leap
 * up or down. The player plays the key it should land on; the frog then hops there and gets the next
 * order. Pure: the frog's position is a MIDI number.
 */
export class HopRound {
  frog: number;
  move: Move;
  hop = 0;
  score = 0;
  combo = 0;
  bestCombo = 0;
  firstTry = 0;
  slips = 0;
  private slippedThisHop = false;

  constructor(readonly level: HopLevel, private rng: () => number = Math.random) {
    // Start somewhere in the middle, so every direction is possible.
    const start = 3 + Math.floor(rng() * (POND.length - 6));
    this.frog = POND[start];
    this.move = pickMove(start, level.kinds, rng);
  }

  get total(): number {
    return this.level.hops;
  }

  get finished(): boolean {
    return this.hop >= this.total;
  }

  get frogIndex(): number {
    return POND.indexOf(this.frog);
  }

  /** Keys the frog may land on right now (for the hint). */
  targets(): number[] {
    return landings(this.move, this.frogIndex).map((i) => POND[i]);
  }

  press(midi: number): HopPress {
    if (this.finished) return { kind: 'wrong', reason: 'The round is over.' };
    const to = POND.indexOf(midi);
    let reason = '';
    if (isBlackKey(midi)) reason = 'Stay on the white keys.';
    else if (to < 0) reason = 'That key is outside the pond.';
    else if (!isMove(this.move, this.frogIndex, to)) reason = this.explain(to);
    if (reason) {
      this.slips++;
      this.slippedThisHop = true;
      this.combo = 0;
      return { kind: 'wrong', reason };
    }

    const clean = !this.slippedThisHop;
    let points = clean ? 100 : 50;
    if (clean) {
      this.firstTry++;
      this.combo++;
      this.bestCombo = Math.max(this.bestCombo, this.combo);
      points += comboBonus(this.combo);
    }
    this.score += points;
    this.frog = midi;
    this.hop++;
    this.slippedThisHop = false;
    if (!this.finished) this.move = pickMove(to, this.level.kinds, this.rng);
    return { kind: 'right', to: midi, points, clean };
  }

  /** Tell the player what their key actually was. */
  private explain(to: number): string {
    const d = to - this.frogIndex;
    if (d === 0) return 'That is the key the frog is on.';
    const size = Math.abs(d) === 1 ? 'a step' : Math.abs(d) === 2 ? 'a skip' : 'a leap';
    return `That was ${size} ${d > 0 ? 'up' : 'down'}.`;
  }

  get accuracy(): number {
    return this.total === 0 ? 0 : this.firstTry / this.total;
  }

  get stars(): Stars {
    return starsFor(this.accuracy);
  }
}
