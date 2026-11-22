import { describe, expect, it } from 'vitest';
import { odeToJoy } from '../data/songs/odeToJoy';
import { twinkleTwinkle } from '../data/songs/twinkleTwinkle';
import { pitchToMidi } from '../domain/notes';
import type { Step, Target } from '../guide/types';
import { lessons } from './registry';

const OCTAVE_NUMBER = /\b[A-G][#b]?-?\d\b/; // "C4", "F#3"

const targetsOf = (step: Step): Target[] =>
  step.kind === 'play' ? (typeof step.targets === 'function' ? step.targets() : step.targets) : [];

/** Every piece of text the player can see in a lesson. */
function visibleText(step: Step): string[] {
  const out: string[] = [step.title];
  if ('body' in step) out.push(...(Array.isArray(step.body) ? step.body : step.body ? [step.body] : []));
  if (step.kind === 'info' && step.list) out.push(...step.list);
  for (const t of targetsOf(step)) out.push(t.label ?? '', t.chip ?? '', t.hint ?? '');
  return out;
}

describe.each(lessons)('lesson "$title"', (lesson) => {
  it('is complete', () => {
    expect(lesson.steps.length).toBeGreaterThan(1);
    expect(lesson.goals.length).toBeGreaterThan(0);
    expect(lesson.summary).not.toMatch(OCTAVE_NUMBER);
    lesson.goals.forEach((g) => expect(g).not.toMatch(OCTAVE_NUMBER));
  });

  it('starts with an explanation and ends with something to play or do', () => {
    expect(lesson.steps[0].kind).toBe('info');
    expect(lesson.steps[lesson.steps.length - 1].kind).not.toBe('info');
  });

  it('every play step has something to play, and every target can be answered', () => {
    for (const step of lesson.steps) {
      if (step.kind !== 'play') continue;
      const targets = targetsOf(step);
      expect(targets.length, step.title).toBeGreaterThan(0);
      for (const t of targets) expect(t.midi !== undefined || typeof t.match === 'function', step.title).toBe(true);
    }
  });

  it('never shows octave numbers like C4', () => {
    for (const step of lesson.steps) for (const text of visibleText(step)) expect(text).not.toMatch(OCTAVE_NUMBER);
  });

  it('rhythm steps have a valid pattern', () => {
    for (const step of lesson.steps) {
      if (step.kind !== 'rhythm') continue;
      expect(step.beats.every((b) => b > 0)).toBe(true);
      expect(step.beats.reduce((a, b) => a + b, 0) % (step.beatsPerBar ?? 4)).toBe(0);
    }
  });

  it('can be rebuilt (random quizzes give new prompts without crashing)', () => {
    for (const step of lesson.steps) {
      targetsOf(step);
      targetsOf(step);
    }
  });
});

describe('song lessons', () => {
  it('the last step plays the whole song', () => {
    for (const song of [odeToJoy, twinkleTwinkle]) {
      const lesson = lessons.find((l) => l.id === song.id)!;
      const plays = lesson.steps.filter((s) => s.kind === 'play');
      const whole = targetsOf(plays[plays.length - 1]);
      expect(whole.map((t) => t.midi)).toEqual(song.notes.map((n) => pitchToMidi(n.pitch)));
    }
  });
});

describe('lesson list', () => {
  it('has unique ids', () => {
    expect(new Set(lessons.map((l) => l.id)).size).toBe(lessons.length);
  });
});
