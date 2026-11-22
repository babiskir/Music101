import { describe, expect, it } from 'vitest';
import { letterTarget, quizTargets, staffTarget, whiteKeys } from './targets';

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
