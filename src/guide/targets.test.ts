import { describe, expect, it } from 'vitest';
import { fingerPhrase, fingerTarget, letterTarget, nameTarget, quizTargets, staffTarget, whiteKeys } from './targets';

const OCTAVE_NUMBER = /\b[A-G][#b]?-?\d\b/; // "C4", "F#3": quizzes must never show these

describe('quiz prompts', () => {
  it('a name prompt accepts that note in any octave, and only that note', () => {
    const t = nameTarget(66); // F sharp
    expect([30, 42, 66, 78].every((m) => t.match!(m))).toBe(true);
    expect(t.match!(65)).toBe(false);
    expect(t.label).toBe('Fa♯/Sol♭');
  });

  it('a letter prompt shows the letter, and its hint gives the name', () => {
    const t = letterTarget(60);
    expect(t.label).toBe('C');
    expect(t.hint).toMatch(/^Do \(C\) is/);
    expect(t.match!(72)).toBe(true);
  });

  it('written prompts are half Do Re Mi and half letters', () => {
    for (let run = 0; run < 50; run++) {
      const labels = quizTargets(whiteKeys(60, 72), 8, 'name').map((t) => t.label!);
      expect(labels.filter((l) => /^[A-G]$/.test(l))).toHaveLength(4);
      expect(labels.filter((l) => /^(Do|Re|Mi|Fa|Sol|La|Si)$/.test(l))).toHaveLength(4);
    }
    const mixed = quizTargets(whiteKeys(60, 72), 400, 'mixed').filter((t) => t.present === 'name');
    const letters = mixed.filter((t) => /^[A-G]$/.test(t.label!)).length;
    expect(Math.abs(letters * 2 - mixed.length)).toBeLessThanOrEqual(1);
  });

  it('staff prompts can be drawn on the bass staff', () => {
    expect(quizTargets([48, 50], 4, 'staff', 'bass').every((t) => t.clef === 'bass')).toBe(true);
    expect(quizTargets([60, 62], 4, 'staff').every((t) => t.clef === 'treble')).toBe(true);
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
