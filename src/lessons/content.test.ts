import { describe, expect, it } from 'vitest';
import { songs } from '../data/songs';
import { noteName, pitchClassName, pitchToMidi } from '../domain/notes';
import { labelsFor } from '../guide/labels';
import type { Choice, Step, Target } from '../guide/types';
import { patternBeats } from '../guide/rhythmPattern';
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
      for (const t of targets) expect(t.midi !== undefined || typeof t.match === 'function' || !!t.keys?.length, step.title).toBe(true);
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
      expect(step.beats.every((b) => b !== 0), step.title).toBe(true);
      expect(step.beats.some((b) => b > 0), `${step.title}: something to play`).toBe(true);
      expect(patternBeats(step.beats) % (step.beatsPerBar ?? 4), step.title).toBe(0);
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

  it('names fade inside a lesson: all, then the first, then none', () => {
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
    expect(labelsFor([60, 62, 64], 'all')).toEqual(['Do\nC', 'Re\nD', 'Mi\nE']);
    expect(labelsFor([60, 62, 64], 'first')).toEqual(['Do\nC', undefined, undefined]);
    expect(labelsFor([60, 62, 64], 'none')).toEqual([undefined, undefined, undefined]);
    expect(labelsFor([60, 62], undefined)).toEqual([undefined, undefined]);
  });
});

describe('do re mi', () => {
  it('fixed do: C is Do, B is Si, black keys are sharps or flats', () => {
    expect([60, 62, 64, 65, 67, 69, 71].map(noteName)).toEqual(['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Si']);
    expect(noteName(61)).toBe('Do♯');
    expect(pitchClassName(10)).toBe('La♯/Si♭');
  });

  it('a written prompt is one name, accepts the key in any octave, and shows no numeral', () => {
    for (const t of quizTargets(whiteKeys(48, 84), 100, 'name')) {
      expect(t.label).toMatch(/^(Do|Re|Mi|Fa|Sol|La|Si|[A-G])$/);
      expect(t.match!(t.ref!)).toBe(true);
      expect(`${t.label}${t.hint}${t.spoken}`).not.toMatch(/\d/);
    }
  });

  it('both names go together: wherever a note is named on a chip or an answer, it has both', () => {
    for (const lesson of lessons) {
      for (const step of lesson.steps) {
        const shown = [
          ...targetsOf(step).map((t) => t.chip ?? ''),
          ...choicesOf(step).flatMap((c) => c.options),
        ];
        for (const text of shown.flatMap((s) => s.split(' + '))) { // "Sol (G) + Do (C)": both hands
          if (/^(Do|Re|Mi|Fa|Sol|La|Si|[A-G])[♯#]?($| \()/.test(text)) { // a note, not "A step"
            expect(text, `${lesson.id}: ${step.title}`).toMatch(/^(Do|Re|Mi|Fa|Sol|La|Si)♯? \([A-G]#?\)$/);
          }
        }
      }
    }
  });
});

describe('the left hand', () => {
  const ids = lessons.map((l) => l.id);
  const lesson = (id: string) => lessons.find((l) => l.id === id)!;

  it('comes after the chords, in order: bass clef, tunes, grand staff', () => {
    const order = ['chords', 'bass-clef', 'left-hand-tunes', 'grand-staff'].map((id) => ids.indexOf(id));
    expect(order.every((i) => i >= 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });

  it('the bass clef lesson only uses the five notes of the left-hand position', () => {
    const pool = lesson('bass-clef').steps.flatMap(targetsOf).map((t) => t.midi ?? t.ref);
    expect(pool.every((m) => whiteKeys(48, 55).includes(m!))).toBe(true);
  });

  it('staff quizzes in the left-hand lessons are drawn on the bass staff', () => {
    for (const id of ['bass-clef', 'left-hand-tunes']) {
      const cards = lesson(id).steps.flatMap(targetsOf).filter((t) => t.present === 'staff');
      expect(cards.length, id).toBeGreaterThan(0);
      expect(cards.every((t) => t.clef === 'bass'), id).toBe(true);
    }
  });

  it('sheet music in the left-hand lessons uses the bass or the grand staff', () => {
    for (const id of ['bass-clef', 'left-hand-tunes', 'grand-staff']) {
      for (const step of lesson(id).steps) {
        if (step.kind === 'play' && step.show?.staff) expect(step.show.clef, `${id}: ${step.title}`).toMatch(/bass|grand/);
        if (step.kind === 'info' && step.staff) expect(step.staff.clef, `${id}: ${step.title}`).toMatch(/bass|grand/);
      }
    }
  });

  it('left-hand tunes stay below middle Do, apart from the landmark itself', () => {
    const tunes = lesson('left-hand-tunes').steps.filter((s) => s.kind === 'play' && s.show?.staff && !s.show.keys);
    for (const s of tunes) expect(targetsOf(s).every((t) => t.midi! < 60), s.title).toBe(true);
  });

  it('"which hand" answers match the staff the note is on', () => {
    const step = lesson('grand-staff').steps.find((s) => s.title === 'Which hand?')!;
    for (let run = 0; run < 20; run++) {
      for (const c of choicesOf(step)) expect(c.options[c.answer]).toBe(c.notes![0] >= 60 ? 'Right hand' : 'Left hand');
    }
  });
});

describe('hands together', () => {
  const lesson = lessons.find((l) => l.id === 'hands-together')!;
  const ids = lessons.map((l) => l.id);

  it('comes after the grand staff', () => {
    expect(ids.indexOf('hands-together')).toBeGreaterThan(ids.indexOf('grand-staff'));
  });

  it('every "together" asks for one key in each hand, and the melody note is the right hand\'s', () => {
    const all = lesson.steps.flatMap(targetsOf).filter((t) => t.keys);
    expect(all.length).toBeGreaterThan(20);
    for (const t of all) {
      expect(t.keys!.filter((k) => k < 60)).toHaveLength(1);
      expect(t.keys!.filter((k) => k >= 60)).toHaveLength(1);
      expect(t.ref).toBe(Math.max(...t.keys!));
    }
  });

  it('the tunes keep the song\'s melody and rhythm, with a bass note on the first beat of every bar', () => {
    for (const song of songs.filter((s) => ['mary-had-a-little-lamb', 'ode-to-joy'].includes(s.id))) {
      const step = lesson.steps.find((s) => s.title.startsWith(song.id === 'ode-to-joy' ? 'Ode to Joy' : 'Mary'))!;
      const targets = targetsOf(step);
      expect(targets.map((t) => t.ref)).toEqual(song.notes.map((n) => pitchToMidi(n.pitch)));
      expect(targets.map((t) => t.beats)).toEqual(song.notes.map((n) => n.beats));
      let at = 0;
      targets.forEach((t, i) => {
        expect(!!t.keys, `${song.id} note ${i}`).toBe(at % song.beatsPerBar === 0);
        at += t.beats!;
      });
    }
  });
});

describe('rests', () => {
  const steps = lessons.find((l) => l.id === 'rests')!.steps.filter((s) => s.kind === 'rhythm');

  it('comes right after bars and time signatures', () => {
    const ids = lessons.map((l) => l.id);
    expect(ids.indexOf('rests')).toBe(ids.indexOf('bars-and-meter') + 1);
  });

  it('every exercise has a rest, and the new ones are heard first', () => {
    for (const s of steps) expect(s.beats.some((b) => b < 0), s.title).toBe(true);
    const firstOnYourOwn = steps.findIndex((s) => !s.listen);
    expect(firstOnYourOwn).toBe(steps.length - 1);
  });

  it('a bar that starts with a rest is not met before rests in the middle', () => {
    const startsSilent = steps.findIndex((s) => s.beats[0] < 0);
    const middle = steps.findIndex((s) => s.beats[0] > 0 && s.beats.some((b) => b < 0));
    expect(middle).toBeLessThan(startsSilent);
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
