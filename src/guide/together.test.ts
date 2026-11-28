import { describe, expect, it } from 'vitest';
import { TOGETHER_MS, TogetherJudge } from './together';

describe('playing keys together', () => {
  it('is complete when both keys land close together, in any order', () => {
    const j = new TogetherJudge([48, 64]);
    expect(j.press(64, 1000, TOGETHER_MS)).toBe('partial');
    expect(j.found).toEqual([64]);
    expect(j.press(48, 1150, TOGETHER_MS)).toBe('complete');
    expect(j.found).toEqual([]);
  });

  it('two keys far apart in time are not together over USB', () => {
    const j = new TogetherJudge([48, 64]);
    j.press(48, 1000, TOGETHER_MS);
    expect(j.press(64, 2000, TOGETHER_MS)).toBe('partial');
    expect(j.press(48, 2100, TOGETHER_MS)).toBe('complete');
  });

  it('with the microphone the keys may come one after another', () => {
    const j = new TogetherJudge([48, 64]);
    j.press(48, 1000, Infinity);
    expect(j.press(64, 9000, Infinity)).toBe('complete');
  });

  it('a key that is not part of it is wrong and starts the attempt again', () => {
    const j = new TogetherJudge([48, 64]);
    j.press(48, 1000, TOGETHER_MS);
    expect(j.press(50, 1050, TOGETHER_MS)).toBe('wrong');
    expect(j.press(64, 1100, TOGETHER_MS)).toBe('partial');
  });
});
