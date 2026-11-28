import { describe, expect, it } from 'vitest';
import { RHYTHM_LEVELS, RhythmJudge, buildTimeline, hitPoints } from './judge';

const SPB = 1000; // 60 bpm
const expected = [0, 1000, 2000, 3000, 4000, 5000];

describe('levels', () => {
  it('every bar holds exactly four beats', () => {
    for (const lv of RHYTHM_LEVELS) {
      for (const bar of lv.patterns) expect(bar.reduce((a, b) => a + b, 0)).toBe(4);
    }
  });
  it('get harder: a faster tempo or shorter notes', () => {
    const bpms = RHYTHM_LEVELS.map((l) => l.bpm);
    expect([...bpms].sort((a, b) => a - b)).toEqual(bpms);
  });
});

describe('buildTimeline', () => {
  it('lays bars end to end', () => {
    expect(buildTimeline([[1, 1, 2], [0.5, 0.5, 1, 2]])).toEqual({
      starts: [0, 1, 2, 4, 4.5, 5, 6],
      lengths: [1, 1, 2, 0.5, 0.5, 1, 2],
      totalBeats: 8,
    });
  });
});

describe('RhythmJudge', () => {
  it('grades by how close a press is to the note', () => {
    const j = new RhythmJudge(expected, SPB, 1);
    expect(j.press(20)?.grade).toBe('perfect');
    expect(j.press(1120)?.grade).toBe('good');
    expect(j.press(1990)?.index).toBe(2);
  });

  it('a note nobody played becomes a miss once its window has closed', () => {
    const j = new RhythmJudge(expected, SPB, 1);
    j.press(0);
    expect(j.sweep(500)).toEqual([]);
    expect(j.sweep(1000 + j.goodMs + 1)).toEqual([1]);
    expect(j.grades[1]).toBe('miss');
  });

  it('skipping a note: the next press belongs to the next note', () => {
    const j = new RhythmJudge(expected, SPB, 1);
    j.press(0);
    const hit = j.press(2010);
    expect(hit?.index).toBe(2);
    expect(j.grades[1]).toBe('miss');
  });

  it('ignores a press far from any waiting note', () => {
    const j = new RhythmJudge(expected, SPB, 1);
    j.press(0);
    expect(j.press(500)).toBeNull(); // half way between two clicks
    expect(j.grades[1]).toBeNull();
  });

  it('learns a steady delay (a microphone) and then grades from there', () => {
    const j = new RhythmJudge(expected, SPB, 1, 0);
    // Every key press is detected 150 ms late: the first ones are "good"... then the delay is learned.
    expect(j.press(150)?.grade).toBe('good');
    j.press(1150);
    j.press(2150);
    expect(j.offsetMs).toBe(150);
    expect(j.press(3150)?.grade).toBe('perfect');
    expect(j.press(4000 + 150 + 300)?.grade).not.toBe('perfect');
  });

  it('keeps the windows narrower than half the shortest note, so eighths never overlap', () => {
    const j = new RhythmJudge([0, 375], 750, 0.5);
    expect(j.goodMs).toBeLessThan(375 / 2 + 1);
  });

  it('summarises into accuracy and stars', () => {
    const j = new RhythmJudge(expected, SPB, 1);
    expected.forEach((t) => j.press(t));
    expect(j.accuracy).toBe(1);
    expect(j.stars).toBe(3);
    const bad = new RhythmJudge(expected, SPB, 1);
    bad.sweep(1e6);
    expect(bad.accuracy).toBe(0);
    expect(bad.stars).toBe(0);
  });
});

describe('hitPoints', () => {
  it('gives more for perfect, a streak bonus, and nothing for a miss', () => {
    expect(hitPoints('perfect', 1)).toBe(110);
    expect(hitPoints('good', 1)).toBe(70);
    expect(hitPoints('miss', 5)).toBe(0);
  });
});
