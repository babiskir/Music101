import { describe, expect, it } from 'vitest';
import { fingerPhrase, fingerTarget, letterTarget, quizTargets, staffTarget, whiteKeys } from './targets';

const OCTAVE_NUMBER = /\b[A-G][#b]?-?\d\b/; // "C4", "F#3": quizzes must never show these

describe('quiz prompts', () => {
  it('a letter prompt accepts that note in any octave, and only that note', () => {
    const t = letterTarget(66); // F#
    expect([30, 42, 66, 78].every((m) => t.match!(m))).toBe(true);
    expect(t.match!(65)).toBe(false);
    expect(t.label).toBe('F#/Gb');
  });

  it('a staff prompt accepts exactly that key', () => {
    const t = staffTarget(64);
    expect(t.midi).toBe(64);
    expect(t.present).toBe('staff');
  });

  it('never writes octave numbers, in any notation', () => {
    for (const notation of ['name', 'staff', 'mixed'] as const) {
      for (const t of quizTargets(whiteKeys(36, 96), 200, notation)) {
        for (const text of [t.label, t.chip, t.hint, typeof t.spoken === 'string' ? t.spoken : '']) {
          expect(text ?? '').not.toMatch(OCTAVE_NUMBER);
        }
      }
    }
  });

  it('never uses a numeral in a prompt, hint or finger name', () => {
    const position = { 1: 60, 2: 62, 3: 64, 4: 65, 5: 67 } as const;
    const all = [
      ...quizTargets(whiteKeys(36, 96), 100, 'mixed'),
      ...([1, 2, 3, 4, 5] as const).map((f) => fingerTarget(position, f)),
    ];
    for (const t of all) {
      for (const text of [t.label, t.chip, t.hint, typeof t.spoken === 'string' ? t.spoken : '']) {
        expect(text ?? '').not.toMatch(/\d/);
      }
    }
    expect([1, 2, 3, 4, 5].map((f) => fingerPhrase(f as 1))).toEqual(['thumb', 'index finger', 'middle finger', 'ring finger', 'pinky finger']);
  });

  it('never asks for the same pitch twice in a row', () => {
    const list = quizTargets([60, 62, 64], 300, 'mixed');
    list.slice(1).forEach((t, i) => expect(t.ref).not.toBe(list[i].ref));
  });

  it('mixed mode uses both presentations, never three of one kind in a row', () => {
    const kinds = quizTargets(whiteKeys(60, 79), 400, 'mixed').map((t) => t.present);
    expect(new Set(kinds)).toEqual(new Set(['name', 'staff']));
    for (let i = 2; i < kinds.length; i++) expect(kinds[i] === kinds[i - 1] && kinds[i] === kinds[i - 2]).toBe(false);
  });

  it('pure modes stay pure', () => {
    expect(new Set(quizTargets(whiteKeys(60, 72), 50, 'name').map((t) => t.present))).toEqual(new Set(['name']));
    expect(new Set(quizTargets(whiteKeys(60, 72), 50, 'staff').map((t) => t.present))).toEqual(new Set(['staff']));
  });
});
