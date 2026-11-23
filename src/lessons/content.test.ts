import { describe, expect, it } from 'vitest';
import { songs } from '../data/songs';
import { pitchToMidi } from '../domain/notes';
import { labelsFor } from '../guide/labels';
import type { Choice, Step, Target } from '../guide/types';
import { solfege } from '../domain/notes';
import { quizTargets, whiteKeys } from '../guide/targets';
import { lessons } from './registry';

const OCTAVE_NUMBER = /\b[A-G][#b]?-?\d\b/; // "C4", "F#3"

const targetsOf = (step: Step): Target[] =>
  step.kind === 'play' ? (typeof step.targets === 'function' ? step.targets() : step.targets) : [];

const choicesOf = (step: Step): Choice[] =>
  step.kind === 'choose' ? (typeof step.choices === 'function' ? step.choices() : step.choices) : [];

/** Every piece of text the player can see in a lesson. */
function visibleText(step: Step): string[] {
  const out: string[] = [step.title];
  if ('body' in step) out.push(...(Array.isArray(step.body) ? step.body : step.body ? [step.body] : []));
  if (step.kind === 'info' && step.list) out.push(...step.list);
  for (const t of targetsOf(step)) out.push(t.label ?? '', t.chip ?? '', t.hint ?? '');
  for (const c of choicesOf(step)) out.push(c.prompt, c.hint ?? '', ...c.options);
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

  it('practice shows notes and words only, never a numeral', () => {
    for (const step of lesson.steps) {
      if (step.kind === 'info') continue; // read-and-continue screens may explain; practice may not
      const spoken = targetsOf(step).map((t) => (typeof t.spoken === 'string' ? t.spoken : ''));
      for (const text of [...visibleText(step), ...spoken]) expect(text, step.title).not.toMatch(/\d/);
    }
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
      choicesOf(step);
      choicesOf(step);
    }
  });

  it('every question has a valid answer and distinct options', () => {
    for (const step of lesson.steps) {
      for (let run = 0; run < 30; run++) {
        const choices = choicesOf(step);
        if (step.kind === 'choose') expect(choices.length, step.title).toBeGreaterThan(0);
        for (const c of choices) {
          expect(c.answer, step.title).toBeGreaterThanOrEqual(0);
          expect(c.answer, step.title).toBeLessThan(c.options.length);
          expect(new Set(c.options).size, step.title).toBe(c.options.length);
        }
      }
    }
  });
});

describe('song lessons', () => {
  it('the last step plays the whole song', () => {
    for (const song of songs) {
      const lesson = lessons.find((l) => l.id === song.id)!;
      const plays = lesson.steps.filter((s) => s.kind === 'play');
      const whole = targetsOf(plays[plays.length - 1]);
      expect(whole.map((t) => t.midi)).toEqual(song.notes.map((n) => pitchToMidi(n.pitch)));
    }
  });
});

describe('songs', () => {
  it.each(songs)('"$title" fills whole bars and has a finger for every note', (song) => {
    const total = song.notes.reduce((sum, n) => sum + n.beats, 0);
    expect(total % song.beatsPerBar).toBe(0);
    expect(song.notes.every((n) => n.finger !== undefined)).toBe(true);
  });
});

describe('lesson list', () => {
  it('has unique ids', () => {
    expect(new Set(lessons.map((l) => l.id)).size).toBe(lessons.length);
  });
});

describe('the road into reading music', () => {
  const ids = lessons.map((l) => l.id);
  const at = (id: string) => ids.indexOf(id);

  it('comes in small steps, before the mnemonics and before the first reading song', () => {
    const ramp = ['steps-and-skips', 'higher-or-lower', 'do-re-mi', 'staff-three-notes', 'staff-five-notes', 'read-short-tunes'];
    ramp.forEach((id, i) => {
      expect(at(id), id).toBeGreaterThanOrEqual(0);
      if (i > 0) expect(at(id), id).toBeGreaterThan(at(ramp[i - 1]));
    });
    expect(at('reading-notes')).toBeGreaterThan(at('staff-landmarks'));
    expect(at('mary-had-a-little-lamb')).toBeGreaterThan(at('read-short-tunes'));
  });

  it('the first staff lessons only use the notes they announce', () => {
    const pool = (id: string) =>
      lessons
        .find((l) => l.id === id)!
        .steps.flatMap(targetsOf)
        .flatMap((t) => (t.midi !== undefined ? [t.midi] : t.ref !== undefined ? [t.ref] : []));
    expect(pool('staff-three-notes').every((m) => [60, 62, 64].includes(m))).toBe(true);
    expect(pool('staff-five-notes').every((m) => whiteKeys(60, 67).includes(m))).toBe(true);
    expect(pool('read-short-tunes').every((m) => whiteKeys(60, 67).includes(m))).toBe(true);
  });

  it('letters fade inside a lesson: all, then the first, then none', () => {
    for (const id of ['staff-three-notes', 'staff-five-notes']) {
      const modes = lessons
        .find((l) => l.id === id)!
        .steps.flatMap((s) => (s.kind === 'play' && s.targets ? [s.show?.labels ?? 'none'] : []))
        .filter((m, i, all) => i === all.indexOf(m) || m !== all[i - 1]);
      expect(modes.lastIndexOf('all'), id).toBeLessThan(modes.indexOf('first'));
      expect(modes.indexOf('first'), id).toBeLessThan(modes.lastIndexOf('none'));
    }
  });
});

describe('labels under notes', () => {
  it('"all" labels every note, "first" only the first, "none" nothing', () => {
    expect(labelsFor([60, 62, 64], 'all')).toEqual(['C', 'D', 'E']);
    expect(labelsFor([60, 62, 64], 'first')).toEqual(['C', undefined, undefined]);
    expect(labelsFor([60, 62, 64], 'none')).toEqual([undefined, undefined, undefined]);
    expect(labelsFor([60, 62], undefined)).toEqual([undefined, undefined]);
  });

  it('adds do re mi next to the letter', () => {
    expect(labelsFor([60, 67], 'all', true)).toEqual(['C · do', 'G · sol']);
  });
});

describe('do re mi', () => {
  it('fixed do: C is do, B is si, black keys have no syllable', () => {
    expect([60, 62, 64, 65, 67, 69, 71].map(solfege)).toEqual(['do', 're', 'mi', 'fa', 'sol', 'la', 'si']);
    expect(solfege(61)).toBeUndefined();
  });

  it('a syllable prompt is the syllable, accepts the key in any octave, and shows no numeral', () => {
    for (const t of quizTargets(whiteKeys(48, 84), 100, 'solfege')) {
      expect(t.label).toMatch(/^(do|re|mi|fa|sol|la|si)$/);
      expect(t.match!(t.ref!)).toBe(true);
      expect(`${t.label}${t.hint}${t.spoken}`).not.toMatch(/\d/);
    }
  });
});

describe('the dotted note is built up slowly', () => {
  const steps = lessons.find((l) => l.id === 'bars-and-meter')!.steps;
  const rhythmSteps = steps.filter((s) => s.kind === 'rhythm');
  const dotted = rhythmSteps.filter((s) => s.beats.includes(1.5));

  it('the first dotted-quarter exercise is one bar, slow, and heard first', () => {
    const first = dotted[0];
    expect(first.beats.reduce((a, b) => a + b, 0)).toBe(4);
    expect(first.bpm).toBeLessThanOrEqual(50);
    expect(first.listen).toBe(true);
  });

  it('every new rhythm is demonstrated before it is graded, up to the full-tempo pattern', () => {
    const fullTempo = dotted.findIndex((s) => s.title === 'Dotted quarter and eighth');
    for (const s of dotted.slice(0, fullTempo)) expect(s.listen, s.title).toBe(true);
  });

  it('a dotted half note comes before the dotted quarter', () => {
    const firstDottedHalf = rhythmSteps.findIndex((s) => s.beats.includes(3) && s.beatsPerBar !== 3);
    expect(firstDottedHalf).toBeGreaterThanOrEqual(0);
    expect(firstDottedHalf).toBeLessThan(rhythmSteps.indexOf(dotted[0]));
  });
});
