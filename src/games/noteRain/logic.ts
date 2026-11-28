import { accepts, allKeys, quizTargets, whiteKeys } from '../../guide/targets';
import type { StaffClef } from '../../features/staff/grand';
import type { Notation, Target } from '../../guide/types';
import { comboBonus, starsFor, type Stars } from '../scoring';
import type { GameLevel } from '../types';

export interface RainLevel extends GameLevel {
  pool: number[];
  notation: Notation;
  /** Staff for the staff gems (default treble). */
  clef?: StaffClef;
  /** Keyboard window shown in 3D (white keys at both ends). */
  keyboard: [number, number];
  /** Note names printed on the 3D keys. */
  names: boolean;
  count: number;
  /** Seconds a gem takes to fall: the first gem, and the last one. */
  fallS: [number, number];
  /** Seconds between two gems appearing: at the start, and at the end. */
  gapS: [number, number];
}

const C_TO_C = whiteKeys(60, 72);

export const RAIN_LEVELS: RainLevel[] = [
  {
    id: 'five-letters', title: 'Five notes', blurb: 'Do to Sol (C to G), with the names on the keys.',
    pool: whiteKeys(60, 67), notation: 'name', keyboard: [60, 72], names: true, count: 12, fallS: [10, 7], gapS: [4.5, 3.2],
  },
  {
    id: 'do-re-mi', title: 'The whole octave', blurb: 'Do to Do (C to C), with the names on the keys.',
    pool: C_TO_C, notation: 'name', keyboard: [60, 72], names: true, count: 14, fallS: [9, 6], gapS: [4, 3],
  },
  {
    id: 'letters', title: 'No help', blurb: 'Do to Do (C to C) with the key names hidden.',
    pool: C_TO_C, notation: 'name', keyboard: [60, 72], names: false, count: 16, fallS: [8, 4.5], gapS: [3.5, 2.2],
  },
  {
    id: 'staff', title: 'Read the staff', blurb: 'Notes on the sheet music, Do to Do (C to C).',
    pool: C_TO_C, notation: 'staff', keyboard: [60, 72], names: false, count: 16, fallS: [9, 5], gapS: [4, 2.6],
  },
  {
    id: 'bass', title: 'Bass clef', blurb: 'The left hand\'s staff: from low Sol up to middle Do (G to C).',
    pool: whiteKeys(43, 60), notation: 'staff', clef: 'bass', keyboard: [43, 60], names: false, count: 14, fallS: [10, 6], gapS: [4.5, 3],
  },
  {
    id: 'sharps', title: 'Staff, names and sharps', blurb: 'Everything mixed, black keys too.',
    pool: allKeys(60, 72), notation: 'mixed', keyboard: [60, 72], names: false, count: 16, fallS: [9, 5], gapS: [4, 2.6],
  },
];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** How fast gem number `i` (0-based) of `total` falls and how soon the next one follows it. */
export function rainTiming(i: number, total: number, level: Pick<RainLevel, 'fallS' | 'gapS'>) {
  const t = total <= 1 ? 0 : i / (total - 1);
  return { fallS: lerp(level.fallS[0], level.fallS[1], t), gapS: lerp(level.gapS[0], level.gapS[1], t) };
}

export interface Gem {
  id: number;
  target: Target;
  spawnedAt: number;
  fallS: number;
  state: 'falling' | 'hit' | 'lost';
}

export type PressResult =
  | { kind: 'hit'; gem: Gem; points: number; quick: boolean }
  | { kind: 'wrong'; gem: Gem }
  | { kind: 'none' };

/** From this far down its path, a gem's key lights up to help: hits after that are worth less. */
export const HELP_FROM = 0.65;
export const MAX_LIVES = 3;
const FIRST_GEM_AT = 0.8;

/**
 * The rules of Note Rain, with no graphics: gems appear one after another and fall; the player has to
 * play the lowest one before it lands. Time is passed in (seconds), so it can be tested without waiting.
 */
export class RainRound {
  readonly gems: Gem[] = [];
  lives = MAX_LIVES;
  score = 0;
  combo = 0;
  bestCombo = 0;
  quick = 0;
  slow = 0;
  wrong = 0;
  private lastSpawn = -Infinity;

  constructor(readonly targets: Target[], private level: Pick<RainLevel, 'fallS' | 'gapS'>) {}

  get total(): number {
    return this.targets.length;
  }

  /** The gem the player should play now: the lowest one still falling. */
  current(): Gem | undefined {
    return this.gems.find((g) => g.state === 'falling');
  }

  /** 0 at the top, 1 at the keys. */
  progress(gem: Gem, now: number): number {
    return Math.min(1, Math.max(0, (now - gem.spawnedAt) / gem.fallS));
  }

  get finished(): boolean {
    return this.lives <= 0 || (this.gems.length >= this.total && !this.current());
  }

  /** Move time forward: spawn the next gem if it is due, and let gems that reached the keys cost a life. */
  tick(now: number): { spawned: Gem[]; lost: Gem[] } {
    const spawned: Gem[] = [];
    const lost: Gem[] = [];
    if (this.lives > 0) {
      for (const g of this.gems) {
        if (g.state === 'falling' && this.progress(g, now) >= 1) {
          g.state = 'lost';
          this.lives--;
          this.combo = 0;
          lost.push(g);
        }
      }
    }
    const i = this.gems.length;
    if (this.lives > 0 && i < this.total && now >= FIRST_GEM_AT) {
      const { fallS, gapS } = rainTiming(i, this.total, this.level);
      if (!this.current() || now - this.lastSpawn >= gapS) {
        const gem: Gem = { id: i, target: this.targets[i], spawnedAt: now, fallS, state: 'falling' };
        this.gems.push(gem);
        this.lastSpawn = now;
        spawned.push(gem);
      }
    }
    return { spawned, lost };
  }

  press(midi: number, now: number): PressResult {
    const gem = this.current();
    if (!gem || this.lives <= 0) return { kind: 'none' };
    if (!accepts(gem.target, midi)) {
      this.wrong++;
      this.combo = 0;
      return { kind: 'wrong', gem };
    }
    const quick = this.progress(gem, now) < HELP_FROM;
    gem.state = 'hit';
    this.combo++;
    this.bestCombo = Math.max(this.bestCombo, this.combo);
    if (quick) this.quick++;
    else this.slow++;
    const points = (quick ? 100 : 40) + comboBonus(this.combo);
    this.score += points;
    return { kind: 'hit', gem, points, quick };
  }

  /** Share of the gems played well: quick hits count in full, slow ones for half. */
  get accuracy(): number {
    return this.total === 0 ? 0 : (this.quick + 0.5 * this.slow) / this.total;
  }

  get stars(): Stars {
    return this.lives <= 0 ? 0 : starsFor(this.accuracy);
  }
}

/** The prompts of one round, drawn at random from the level's notes. */
export const rainTargets = (level: RainLevel): Target[] => quizTargets(level.pool, level.count, level.notation, level.clef);
