import { describe, expect, it } from 'vitest';
import { nameTarget, staffTarget } from '../../guide/targets';
import { RAIN_LEVELS, RainRound, rainTargets, rainTiming } from './logic';

const level = { fallS: [10, 5] as [number, number], gapS: [4, 2] as [number, number] };
const targets = () => [nameTarget(60), nameTarget(62), staffTarget(64)];

describe('rainTiming', () => {
  it('starts slow and ends fast', () => {
    expect(rainTiming(0, 5, level)).toEqual({ fallS: 10, gapS: 4 });
    expect(rainTiming(4, 5, level)).toEqual({ fallS: 5, gapS: 2 });
    expect(rainTiming(0, 1, level).fallS).toBe(10);
  });
});

describe('RAIN_LEVELS', () => {
  it('only ask for keys inside the 3D keyboard, and never the same key twice in a row', () => {
    for (const lv of RAIN_LEVELS) {
      expect(lv.keyboard[0]).toBeLessThanOrEqual(Math.min(...lv.pool));
      expect(lv.keyboard[1]).toBeGreaterThanOrEqual(Math.max(...lv.pool));
      const t = rainTargets(lv);
      expect(t).toHaveLength(lv.count);
      t.slice(1).forEach((x, i) => expect(x.ref).not.toBe(t[i].ref));
    }
  });
});

describe('RainRound', () => {
  it('spawns the first gem after a short wait, then the next after the gap', () => {
    const r = new RainRound(targets(), level);
    expect(r.tick(0.1).spawned).toHaveLength(0);
    expect(r.tick(1).spawned).toHaveLength(1);
    expect(r.tick(2).spawned).toHaveLength(0); // still falling, gap not over
    expect(r.tick(5.1).spawned).toHaveLength(1);
  });

  it('spawns the next gem right away once the player cleared the field', () => {
    const r = new RainRound(targets(), level);
    r.tick(1);
    r.press(60, 1.5);
    expect(r.tick(1.6).spawned).toHaveLength(1);
  });

  it('names accept any octave; a staff note needs the exact key', () => {
    const r = new RainRound(targets(), level);
    r.tick(1);
    expect(r.press(72, 1.5).kind).toBe('hit'); // C, an octave up
    r.tick(1.6);
    expect(r.press(50, 2).kind).toBe('hit'); // D, two octaves down
    r.tick(2.1);
    expect(r.press(52, 2.5).kind).toBe('wrong'); // E, but the staff note is the E above middle C
    expect(r.press(64, 2.6).kind).toBe('hit');
    expect(r.finished).toBe(true);
  });

  it('wrong keys reset the streak but cost no life; quick hits score more than slow ones', () => {
    const r = new RainRound(targets(), level);
    r.tick(1);
    r.press(60, 2); // 10% down: quick, +100 and a streak bonus of 10
    expect(r.score).toBe(110);
    r.tick(2.1);
    expect(r.press(61, 2.2).kind).toBe('wrong');
    expect(r.combo).toBe(0);
    expect(r.lives).toBe(3);
    r.press(62, 2.1 + 8); // past 65% of its fall: slow
    expect(r.slow).toBe(1);
  });

  it('a gem that lands costs a life, and losing all three ends the round', () => {
    const r = new RainRound(targets(), level);
    r.tick(1);
    const out = r.tick(12);
    expect(out.lost).toHaveLength(1);
    expect(r.lives).toBe(2);
    for (let t = 13; t < 400 && !r.finished; t += 1) r.tick(t);
    expect(r.finished).toBe(true);
    expect(r.stars).toBe(0);
  });

  it('plays a perfect round to three stars', () => {
    const r = new RainRound(targets(), level);
    let t = 1;
    while (!r.finished) {
      r.tick(t);
      const g = r.current();
      if (g) r.press(g.target.ref!, t + 0.2);
      t += 0.3;
      if (t > 100) throw new Error('round did not end');
    }
    expect(r.stars).toBe(3);
    expect(r.bestCombo).toBe(3);
  });
});
