import { describe, expect, it } from 'vitest';
import { HOP_LEVELS, HopRound, POND, isMove, landings, moveText, pickMove } from './logic';

const seeded = (seed = 1) => () => {
  seed = (seed * 16807) % 2147483647;
  return seed / 2147483647;
};

describe('isMove', () => {
  it('knows steps, skips, leaps and repeats by white-key distance', () => {
    expect(isMove({ kind: 'step', dir: 1 }, 3, 4)).toBe(true);
    expect(isMove({ kind: 'step', dir: 1 }, 3, 2)).toBe(false);
    expect(isMove({ kind: 'skip', dir: -1 }, 5, 3)).toBe(true);
    expect(isMove({ kind: 'leap', dir: 1 }, 0, 3)).toBe(true);
    expect(isMove({ kind: 'leap', dir: 1 }, 0, 2)).toBe(false);
    expect(isMove({ kind: 'leap', dir: -1 }, 9, 2)).toBe(true);
    expect(isMove({ kind: 'repeat', dir: 0 }, 4, 4)).toBe(true);
  });
  it('matches the lesson: C to D is a step, C to E a skip, C to G a leap', () => {
    const c = POND.indexOf(60);
    expect(isMove({ kind: 'step', dir: 1 }, c, POND.indexOf(62))).toBe(true);
    expect(isMove({ kind: 'skip', dir: 1 }, c, POND.indexOf(64))).toBe(true);
    expect(isMove({ kind: 'leap', dir: 1 }, c, POND.indexOf(67))).toBe(true);
  });
});

describe('pickMove', () => {
  it('only asks for moves that fit inside the pond', () => {
    const rng = seeded(7);
    for (let from = 0; from < POND.length; from++) {
      for (let n = 0; n < 20; n++) {
        const m = pickMove(from, ['step', 'skip', 'leap', 'repeat'], rng);
        expect(landings(m, from).length).toBeGreaterThan(0);
      }
    }
  });
});

describe('moveText', () => {
  it('says it in words', () => {
    expect(moveText({ kind: 'skip', dir: -1 })).toBe('A skip down');
    expect(moveText({ kind: 'repeat', dir: 0 })).toBe('The same key again');
  });
});

describe('HopRound', () => {
  it('moves the frog to the key that was played and asks for a new hop', () => {
    const r = new HopRound(HOP_LEVELS[0], seeded(3));
    const [target] = r.targets();
    const res = r.press(target);
    expect(res).toMatchObject({ kind: 'right', clean: true });
    expect(r.frog).toBe(target);
    expect(r.hop).toBe(1);
  });

  it('a slip keeps the frog where it is and halves the points', () => {
    const r = new HopRound(HOP_LEVELS[1], seeded(5));
    const start = r.frog;
    const wrong = POND.find((m) => !r.targets().includes(m))!;
    expect(r.press(wrong).kind).toBe('wrong');
    expect(r.frog).toBe(start);
    const res = r.press(r.targets()[0]);
    expect(res).toMatchObject({ kind: 'right', clean: false, points: 50 });
    expect(r.firstTry).toBe(0);
  });

  it('a black key is a slip with a clear reason', () => {
    const r = new HopRound(HOP_LEVELS[0], seeded(2));
    const res = r.press(61);
    expect(res).toMatchObject({ kind: 'wrong', reason: 'Stay on the white keys.' });
  });

  it('tells the player what they did instead', () => {
    const r = new HopRound({ ...HOP_LEVELS[0], kinds: ['step'] }, seeded(4));
    const i = r.frogIndex;
    const far = POND[i + 4] ?? POND[i - 4];
    const res = r.press(far);
    expect(res.kind === 'wrong' && res.reason).toMatch(/leap/);
  });

  it('a clean round earns three stars and ends after the right number of hops', () => {
    for (const level of HOP_LEVELS) {
      const r = new HopRound(level, seeded(11));
      let guard = 0;
      while (!r.finished && guard++ < 100) r.press(r.targets()[0]);
      expect(r.hop).toBe(level.hops);
      expect(r.stars).toBe(3);
      expect(r.bestCombo).toBe(level.hops);
    }
  });
});
