import { allKeys, quizTargets, whiteKeys } from '../guide/targets';
import type { Step } from '../guide/types';
import { classes, lessonsOf, type ClassDef } from '../lessons/classes';
import { rhythmStep } from '../lessons/content/builders';
import { nextRandom } from './rng';

/** A step a run can draw, with where it came from (shown small above the step). */
export interface PoolStep {
  step: Step;
  from: string;
}

/** Rhythm cells: each fills a whole number of beats. Negative = rest. */
const CELLS: Record<'basic' | 'full', number[][]> = {
  basic: [[1], [1], [2], [0.5, 0.5]],
  full: [[1], [1], [2], [0.5, 0.5], [1.5, 0.5], [-1], [3], [0.5, 0.5, 1]],
};

/** Two bars of 4/4 put together from random cells; never starts with a rest. */
export function randomRhythm(level: 'basic' | 'full', state: number): [number[], number] {
  const cells = CELLS[level];
  const out: number[] = [];
  let s = state;
  for (let bar = 0; bar < 2; bar++) {
    let left = 4;
    while (left > 0) {
      const fits = cells.filter((c) => c.reduce((a, b) => a + Math.abs(b), 0) <= left && !(out.length === 0 && c[0] < 0));
      const [r, s2] = nextRandom(s);
      s = s2;
      const cell = fits[Math.floor(r * fits.length)];
      out.push(...cell);
      left -= cell.reduce((a, b) => a + Math.abs(b), 0);
    }
  }
  return [out, s];
}

const rhythmDrill = (beats: number[], bpm: number) =>
  rhythmStep('A new rhythm', beats, { bpm, listen: true, body: 'Made up just for this run. Any key, on every note that lights up.' });

/** Fresh exercises made up for each run, so it is never only the lesson steps again. */
function drillsFor(c: ClassDef, state: number): [PoolStep[], number] {
  const from = `${c.title} · new`;
  const quiz = (title: string, pool: number[], count: number, notation: 'name' | 'staff' | 'mixed', clef: 'treble' | 'bass' = 'treble', keyboard: [number, number] = [60, 84]): PoolStep => ({
    from,
    step: { kind: 'play', title, names: false, keyboard, targets: () => quizTargets(pool, count, notation, clef) },
  });
  let s = state;
  const rhythms = (level: 'basic' | 'full', bpm: number, n: number): PoolStep[] =>
    Array.from({ length: n }, () => {
      const [beats, s2] = randomRhythm(level, s);
      s = s2;
      return { from, step: rhythmDrill(beats, bpm) };
    });
  let out: PoolStep[];
  switch (c.id) {
    case 'keyboard':
      out = [quiz('Quick names', whiteKeys(60, 72), 6, 'name', 'treble', [60, 72]), quiz('Black keys too', allKeys(60, 72), 6, 'name', 'treble', [60, 72])];
      break;
    case 'rhythm':
      out = rhythms('full', 66, 3);
      break;
    case 'first-reading':
      out = [quiz('Read five notes', whiteKeys(60, 67), 6, 'staff', 'treble', [60, 72]), ...rhythms('basic', 60, 1)];
      break;
    case 'first-songs':
      out = [quiz('Notes of the songs', whiteKeys(60, 72), 6, 'mixed', 'treble', [60, 72]), ...rhythms('basic', 72, 1)];
      break;
    case 'reading-more':
      out = [quiz('The whole treble staff', whiteKeys(60, 77), 8, 'mixed'), quiz('Sharps on the way', allKeys(60, 72), 6, 'name', 'treble', [60, 72])];
      break;
    case 'left-hand':
      out = [quiz('Bass staff', whiteKeys(43, 55), 6, 'staff', 'bass', [36, 60])];
      break;
    default:
      out = [];
  }
  return [out, s];
}

/** Everything a run over these classes can draw: the lessons' exercises (not the reading pages) plus new drills. */
export function buildPool(classIds: string[], state: number): [PoolStep[], number] {
  let s = state;
  const out: PoolStep[] = [];
  for (const c of classes.filter((x) => classIds.includes(x.id))) {
    for (const l of lessonsOf(c)) {
      for (const step of l.steps) if (step.kind !== 'info') out.push({ step, from: l.title });
    }
    const [drills, s2] = drillsFor(c, s);
    s = s2;
    out.push(...drills);
  }
  return [out, s];
}
