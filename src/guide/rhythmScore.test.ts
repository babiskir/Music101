import { describe, expect, it } from 'vitest';
import { scoreRhythm } from './rhythmScore';

const SPB = 1000; // 60 BPM
const expected = [0, 1000, 2000, 3000];

describe('scoreRhythm', () => {
  it('passes steady playing, even with a constant 150 ms microphone delay', () => {
    const r = scoreRhythm(expected, expected.map((t) => t + 150), SPB, 1);
    expect(r.status).toBe('ok');
    expect(Math.round(r.offsetMs)).toBe(150);
    expect(r.maxDevMs).toBeLessThan(1);
  });

  it('tolerates small wobble', () => {
    expect(scoreRhythm(expected, [20, 1060, 1980, 3040], SPB, 1).status).toBe('ok');
  });

  it('flags one note far off the beat as uneven', () => {
    const r = scoreRhythm(expected, [0, 1000, 2450, 3000], SPB, 1);
    expect(r.status).toBe('uneven');
    expect(r.maxDevMs).toBeGreaterThan(r.windowMs);
  });

  it('reports missing and extra notes', () => {
    expect(scoreRhythm(expected, [0, 1000, 2000], SPB, 1).status).toBe('missing');
    expect(scoreRhythm(expected, [0, 500, 1000, 2000, 3000], SPB, 1).status).toBe('extra');
  });

  it('ignores taps long before the first note (during the count-in)', () => {
    expect(scoreRhythm(expected, [-3000, -2000, 0, 1000, 2000, 3000], SPB, 1).status).toBe('ok');
  });

  it('is stricter for eighth notes', () => {
    const slow = scoreRhythm(expected, expected, SPB, 1).windowMs;
    const eighths = scoreRhythm(expected, expected, SPB, 0.5).windowMs;
    expect(eighths).toBeLessThan(slow);
  });
});
