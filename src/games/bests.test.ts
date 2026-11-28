import { describe, expect, it } from 'vitest';
import { mergeBest } from './bests';

describe('mergeBest', () => {
  it('the first result is the best, if it scored anything', () => {
    expect(mergeBest(undefined, { score: 500, stars: 2 })).toEqual({ best: { score: 500, stars: 2 }, isRecord: true });
    expect(mergeBest(undefined, { score: 0, stars: 0 }).isRecord).toBe(false);
  });
  it('keeps the best score and the most stars separately', () => {
    const m = mergeBest({ score: 900, stars: 2 }, { score: 600, stars: 3 });
    expect(m.best).toEqual({ score: 900, stars: 3 });
    expect(m.isRecord).toBe(false);
  });
  it('flags a new record', () => {
    expect(mergeBest({ score: 300, stars: 1 }, { score: 400, stars: 1 }).isRecord).toBe(true);
    expect(mergeBest({ score: 300, stars: 1 }, { score: 300, stars: 1 }).isRecord).toBe(false);
  });
});
