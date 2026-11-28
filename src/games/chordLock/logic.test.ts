import { describe, expect, it } from 'vitest';
import { CHORD_LEVELS, ChordRound, chordNotes, chordSequence, toneOf } from './logic';

describe('chords', () => {
  it('are the C, F and G chords of the lesson', () => {
    expect(chordNotes('C')).toEqual([60, 64, 67]);
    expect(chordNotes('F')).toEqual([65, 69, 72]);
    expect(chordNotes('G')).toEqual([67, 71, 74]);
  });
  it('recognise a note in any octave', () => {
    expect(toneOf('C', 48)).toBe(0);
    expect(toneOf('C', 76)).toBe(1);
    expect(toneOf('C', 79)).toBe(2);
    expect(toneOf('C', 62)).toBe(-1);
  });
  it('never repeat a chord twice in a row', () => {
    const seq = chordSequence(60);
    seq.slice(1).forEach((c, i) => expect(c).not.toBe(seq[i]));
  });
  it('levels have sensible settings', () => {
    for (const lv of CHORD_LEVELS) expect(lv.rounds).toBeGreaterThan(0);
  });
});

describe('ChordRound', () => {
  it('completes a chord in any order and moves to the next', () => {
    const r = new ChordRound(['C', 'F'], null);
    r.start(0);
    expect(r.press(67, 1)).toMatchObject({ kind: 'new', tone: 2, complete: false });
    expect(r.press(60, 2)).toMatchObject({ kind: 'new', tone: 0, complete: false });
    const last = r.press(64, 3);
    expect(last).toMatchObject({ kind: 'new', tone: 1, complete: true });
    expect(r.index).toBe(1);
    expect(r.found).toEqual([false, false, false]);
    expect(r.score).toBe(210); // 200 for a clean chord + a streak bonus of 10
  });

  it('a note already found is ignored, a wrong one is a slip that halves the chord', () => {
    const r = new ChordRound(['C'], null);
    r.start(0);
    r.press(60, 1);
    expect(r.press(72, 1.5).kind).toBe('again'); // C again, one octave up
    expect(r.press(62, 2).kind).toBe('wrong');
    r.press(64, 3);
    const done = r.press(67, 4);
    expect(done).toMatchObject({ complete: true, points: 100 });
    expect(r.slipped).toBe(1);
    expect(r.finished).toBe(true);
    expect(r.accuracy).toBe(0.5);
  });

  it('runs out of time chord by chord, and a faster chord earns a time bonus', () => {
    const r = new ChordRound(['C', 'F', 'G'], 10);
    r.start(0);
    expect(r.tick(5)).toBe(false);
    expect(r.tick(10)).toBe(true);
    expect(r.index).toBe(1);
    expect(r.timeLeft(10)).toBe(10);
    r.press(65, 10.25);
    r.press(69, 10.25);
    const fast = r.press(72, 10.25);
    expect(fast).toMatchObject({ complete: true });
    if (fast.kind === 'new') expect(fast.points).toBe(200 + 10 + 49);
    expect(r.timedOut).toBe(1);
  });

  it('a perfect round earns three stars', () => {
    const r = new ChordRound(['C', 'G'], null);
    r.start(0);
    chordNotes('C').forEach((m) => r.press(m, 1));
    chordNotes('G').forEach((m) => r.press(m, 2));
    expect(r.finished).toBe(true);
    expect(r.stars).toBe(3);
    expect(r.bestCombo).toBe(2);
  });
});
