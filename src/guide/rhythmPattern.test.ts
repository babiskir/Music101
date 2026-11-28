import { describe, expect, it } from 'vitest';
import { patternBeats, readPattern, shortestGap, sounding } from './rhythmPattern';

describe('rhythm patterns with rests', () => {
  it('a negative length is a rest of that length', () => {
    expect(readPattern([1, -1, 2])).toEqual([
      { start: 0, beats: 1, rest: false },
      { start: 1, beats: 1, rest: true },
      { start: 2, beats: 2, rest: false },
    ]);
    expect(patternBeats([1, -1, 2])).toBe(4);
  });

  it('only the notes you play are expected', () => {
    const p = readPattern([-1, 1, 1, 1, -4]);
    expect(sounding(p).map((n) => n.start)).toEqual([1, 2, 3]);
  });

  it('the shortest gap is measured between notes you play, across rests', () => {
    expect(shortestGap(readPattern([1, -1, 1, 0.5, 0.5]))).toBe(0.5);
    expect(shortestGap(readPattern([2, -2, 2]))).toBe(4);
    expect(shortestGap(readPattern([-1, 3]))).toBe(3);
  });
});
