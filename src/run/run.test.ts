import { describe, expect, it } from 'vitest';
import { classes } from '../lessons/classes';
import { applyTwists, multiplier } from './modifiers';
import { buildPool, randomRhythm } from './pool';
import { nextRandom, sample, seedFrom } from './rng';
import { attempt, choosePick, newRun, skipStep, stepDone, streakMultiplier, type RunState } from './run';

const POOL = 20;
const ALL = { runs: 99, wins: 99 };
const start = (hard = false) => newRun({ poolSize: POOL, seed: 42, hard });

/** Finish every step of the current round without mistakes. */
function clearRound(s: RunState): RunState {
  let cur = s;
  const round = cur.round;
  while (cur.phase === 'step' && cur.round === round) cur = stepDone(attempt(cur, true, 'play'), POOL, ALL);
  return cur;
}

describe('random numbers', () => {
  it('are the same for the same seed', () => {
    expect(nextRandom(7)).toEqual(nextRandom(7));
    expect(sample([1, 2, 3, 4, 5], 3, 9)).toEqual(sample([1, 2, 3, 4, 5], 3, 9));
    expect(seedFrom('daily 2026-11-28')).not.toBe(seedFrom('daily 2026-11-29'));
  });

  it('sample picks different items', () => {
    const [picked] = sample([1, 2, 3, 4, 5], 5, 3);
    expect([...picked].sort()).toEqual([1, 2, 3, 4, 5]);
  });
});

describe('a run', () => {
  it('starts with 3 hearts and a round of 3 different steps', () => {
    const s = start();
    expect(s.hearts).toBe(3);
    expect(s.queue).toHaveLength(3);
    expect(new Set(s.queue).size).toBe(3);
  });

  it('hard mode: 2 hearts and No names from the start', () => {
    const s = start(true);
    expect(s.hearts).toBe(2);
    expect(s.taken).toContain('blind');
  });

  it('a step costs at most one heart, however many mistakes', () => {
    let s = start();
    s = attempt(s, false, 'play');
    s = attempt(s, false, 'play');
    s = attempt(s, false, 'play');
    expect(s.hearts).toBe(2);
    expect(s.streak).toBe(0);
    s = stepDone(s, POOL, ALL);
    s = attempt(s, false, 'play');
    expect(s.hearts).toBe(1);
  });

  it('is lost when the hearts run out', () => {
    let s = start();
    for (let i = 0; i < 3; i++) s = stepDone(attempt(s, false, 'play'), POOL, ALL);
    expect(s.phase).toBe('lost');
  });

  it('a streak multiplies the points', () => {
    expect(streakMultiplier(0)).toBe(1);
    expect(streakMultiplier(5)).toBe(1.5);
    expect(streakMultiplier(100)).toBe(3);
    let s = start();
    for (let i = 0; i < 5; i++) s = attempt(s, true, 'play');
    const before = s.score;
    s = attempt(s, true, 'play');
    expect(s.score - before).toBe(15);
  });

  it('offers picks after a round, and the next round starts after picking', () => {
    let s = clearRound(start());
    expect(s.phase).toBe('pick');
    expect(s.offers.length).toBeGreaterThan(0);
    expect(s.offers.length).toBeLessThanOrEqual(3);
    s = choosePick(s, s.offers[0], POOL);
    expect(s.phase).toBe('step');
    expect(s.round).toBe(1);
  });

  it('twists raise the multiplier; the shield saves one heart', () => {
    expect(multiplier(['blind', 'no-hints'])).toBeCloseTo(1.875);
    let s = clearRound(start());
    s = { ...s, offers: ['shield'] };
    s = choosePick(s, 'shield', POOL);
    expect(s.shield).toBe(true);
    s = attempt(s, false, 'play');
    expect(s.hearts).toBe(3);
    expect(s.shield).toBe(false);
  });

  it('locked picks are not offered to a new player', () => {
    let s = start();
    for (let r = 0; r < 4; r++) {
      s = clearRound(s);
      if (s.phase !== 'pick') break;
      expect(s.offers).not.toContain('shield');
      expect(s.offers).not.toContain('presto');
      s = choosePick(s, null, POOL);
    }
  });

  it('is won after five rounds, with a bonus for the hearts left', () => {
    let s = start();
    for (let r = 0; r < 5; r++) {
      s = clearRound(s);
      if (s.phase === 'pick') s = choosePick(s, null, POOL);
    }
    expect(s.phase).toBe('won');
    expect(s.score).toBeGreaterThan(300);
  });

  it('giving up a step costs a heart and moves on', () => {
    const s = skipStep(start(), POOL, ALL);
    expect(s.hearts).toBe(2);
    expect(s.at).toBe(1);
  });

  it('marathon adds a step to every following round', () => {
    let s = clearRound(start());
    s = choosePick({ ...s, offers: ['marathon'] }, 'marathon', POOL);
    expect(s.queue).toHaveLength(4);
  });
});

describe('the pool', () => {
  it('has exercises for every class, and no reading pages', () => {
    for (const c of classes) {
      const [pool] = buildPool([c.id], 1);
      expect(pool.length).toBeGreaterThan(3);
      expect(pool.every((p) => p.step.kind !== 'info')).toBe(true);
    }
  });

  it('made-up rhythms fill two whole bars of 4 and never start with a rest', () => {
    let s = 5;
    for (let i = 0; i < 50; i++) {
      const [beats, s2] = randomRhythm('full', s);
      s = s2;
      expect(beats.reduce((a, b) => a + Math.abs(b), 0)).toBe(8);
      expect(beats[0]).toBeGreaterThan(0);
    }
  });

  it('twists change a copy of the step, never the lesson', () => {
    const [pool] = buildPool(['rhythm'], 1);
    const rhythm = pool.find((p) => p.step.kind === 'rhythm')!.step;
    const faster = applyTwists(rhythm, ['presto', 'cold-start']);
    expect(faster.kind === 'rhythm' && faster.bpm).toBeGreaterThan(rhythm.kind === 'rhythm' ? rhythm.bpm : 0);
    expect(faster.kind === 'rhythm' && faster.listen).toBe(false);
    expect(faster).not.toBe(rhythm);
  });
});
