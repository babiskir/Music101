import { PICKS, multiplier, pickById, type Pick } from './modifiers';
import { sample } from './rng';

/**
 * A practice run, roguelite style: rounds of exercises drawn at random from a class, three hearts,
 * a streak that multiplies the points, and a pick between rounds (a twist for more points, or a perk).
 * Plain data plus pure functions, so the screen only renders it.
 */
export interface RunState {
  rng: number;
  rounds: number;
  round: number; // 0-based
  stepsPerRound: number;
  /** Pool indexes for this round, and which one is being played. */
  queue: number[];
  at: number;
  /** Pool indexes already drawn in this run (drawn again only once the pool runs out). */
  used: number[];
  hearts: number;
  maxHearts: number;
  shield: boolean;
  score: number;
  streak: number;
  bestStreak: number;
  /** Twists and perks taken, in order. */
  taken: string[];
  /** The current step already cost a heart (each step costs at most one). */
  stepHurt: boolean;
  stepMistakes: number;
  cleanSteps: number;
  stepsPlayed: number;
  phase: 'step' | 'pick' | 'lost' | 'won';
  offers: string[];
}

export interface RunOptions {
  poolSize: number;
  seed: number;
  hard?: boolean;
  rounds?: number;
  /** For which picks are unlocked. */
  records?: { runs: number; wins: number };
  /** Kinds of step present in the pool (twists for rhythm only show up when there are rhythms). */
  kinds?: string[];
}

export const MAX_HEARTS = 5;
const BASE = { play: 10, choose: 10, rhythm: 40 } as const;
const CLEAN_BONUS = 25;
const ROUND_BONUS = 50;
const WIN_BONUS_PER_HEART = 100;

/** 1 · 1.5 · 2 · 2.5 · 3 for streaks of 0-4, 5-9, 10-14, 15-19, 20+. */
export const streakMultiplier = (streak: number): number => Math.min(3, 1 + 0.5 * Math.floor(streak / 5));

function stepsPerRound(base: number, taken: string[]) {
  return base + (taken.includes('marathon') ? 1 : 0);
}

function drawRound(s: RunState, poolSize: number): RunState {
  let available = Array.from({ length: poolSize }, (_, i) => i).filter((i) => !s.used.includes(i));
  let used = s.used;
  if (available.length < s.stepsPerRound) {
    used = [];
    available = Array.from({ length: poolSize }, (_, i) => i);
  }
  const [queue, rng] = sample(available, s.stepsPerRound, s.rng);
  return { ...s, rng, queue, at: 0, used: [...used, ...queue], stepHurt: false, stepMistakes: 0 };
}

export function newRun(o: RunOptions): RunState {
  const hearts = o.hard ? 2 : 3;
  const base: RunState = {
    rng: o.seed,
    rounds: o.rounds ?? 5,
    round: 0,
    stepsPerRound: 3,
    queue: [],
    at: 0,
    used: [],
    hearts,
    maxHearts: hearts,
    shield: false,
    score: 0,
    streak: 0,
    bestStreak: 0,
    taken: o.hard ? ['blind'] : [],
    stepHurt: false,
    stepMistakes: 0,
    cleanSteps: 0,
    stepsPlayed: 0,
    phase: 'step',
    offers: [],
  };
  return drawRound(base, o.poolSize);
}

export const currentIndex = (s: RunState): number => s.queue[s.at];

/** One judged answer: a key press, a tapped answer, or one try at a rhythm. */
export function attempt(s: RunState, ok: boolean, kind: keyof typeof BASE): RunState {
  if (s.phase !== 'step') return s;
  if (ok) {
    const streak = s.streak + 1;
    const points = Math.round(BASE[kind] * streakMultiplier(s.streak) * multiplier(s.taken));
    return { ...s, streak, bestStreak: Math.max(s.bestStreak, streak), score: s.score + points };
  }
  const hurt = !s.stepHurt;
  let { hearts, shield } = s;
  if (hurt) {
    if (shield) shield = false;
    else hearts -= 1;
  }
  return {
    ...s,
    streak: 0,
    hearts,
    shield,
    stepHurt: true,
    stepMistakes: s.stepMistakes + 1,
    phase: hearts <= 0 ? 'lost' : 'step',
  };
}

/** Give up on the current step: it counts as a lost heart (if it has not cost one yet) and moves on. */
export function skipStep(s: RunState, poolSize: number, records?: RunOptions['records'], kinds?: string[]): RunState {
  const hurt = attempt(s, false, 'play');
  return hurt.phase === 'lost' ? hurt : stepDone(hurt, poolSize, records, kinds);
}

/** The pick offers after a round: up to 3 unlocked picks, never one already taken (perks may repeat). */
export function offersFor(s: RunState, records: RunOptions['records'] = { runs: 0, wins: 0 }, kinds?: string[]): [string[], number] {
  const ok = (p: Pick) =>
    (p.kind === 'perk' || !s.taken.includes(p.id)) &&
    (!p.unlock || ((records.runs >= (p.unlock.runs ?? 0)) && records.wins >= (p.unlock.wins ?? 0))) &&
    (!p.needs || !kinds || kinds.includes(p.needs)) &&
    !(p.id === 'heart' && s.hearts >= MAX_HEARTS) &&
    !(p.id === 'shield' && s.shield);
  const [picked, rng] = sample(PICKS.filter(ok).map((p) => p.id), 3, s.rng);
  return [picked, rng];
}

/** The current step is finished (every note played, every question answered, the rhythm steady). */
export function stepDone(s: RunState, poolSize: number, records?: RunOptions['records'], kinds?: string[]): RunState {
  if (s.phase !== 'step') return s;
  const clean = s.stepMistakes === 0;
  let next: RunState = {
    ...s,
    score: s.score + (clean ? Math.round(CLEAN_BONUS * multiplier(s.taken)) : 0),
    cleanSteps: s.cleanSteps + (clean ? 1 : 0),
    stepsPlayed: s.stepsPlayed + 1,
    stepHurt: false,
    stepMistakes: 0,
  };
  if (s.at + 1 < s.queue.length) return { ...next, at: s.at + 1 };
  // round finished
  next = { ...next, score: next.score + Math.round(ROUND_BONUS * multiplier(s.taken)) };
  if (s.round + 1 >= s.rounds) {
    return { ...next, phase: 'won', score: next.score + WIN_BONUS_PER_HEART * next.hearts };
  }
  const [offers, rng] = offersFor(next, records, kinds);
  if (!offers.length) return drawRound({ ...next, round: s.round + 1, rng }, poolSize);
  return { ...next, phase: 'pick', offers, rng };
}

/** Take one of the offers (or none, with `id` null) and start the next round. */
export function choosePick(s: RunState, id: string | null, poolSize: number): RunState {
  if (s.phase !== 'pick') return s;
  let next: RunState = { ...s, phase: 'step', offers: [], round: s.round + 1 };
  const p = id && s.offers.includes(id) ? pickById(id) : undefined;
  if (p) {
    next = { ...next, taken: [...next.taken, p.id] };
    if (p.id === 'heart') next = { ...next, hearts: Math.min(MAX_HEARTS, next.hearts + 1), maxHearts: Math.max(next.maxHearts, Math.min(MAX_HEARTS, next.hearts + 1)) };
    if (p.id === 'shield') next = { ...next, shield: true };
    if (p.id === 'focus') next = { ...next, streak: Math.max(next.streak, 5) };
  }
  next = { ...next, stepsPerRound: stepsPerRound(3, next.taken) };
  return drawRound(next, poolSize);
}

/** The run's points multiplier right now (twists × streak), for the display. */
export function currentMultiplier(s: RunState): number {
  return multiplier(s.taken) * streakMultiplier(s.streak);
}

