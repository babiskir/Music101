import { whiteKeys } from '../../guide/targets';
import type { Step, Target } from '../../guide/types';
import type { LessonDef } from '../types';
import { noteTarget } from './builders';

/** White keys from middle C up to the G above the next C: positions in this list are "white keys away". */
const W = whiteKeys(60, 79);

const word = (d: number): string => {
  const size = Math.abs(d) === 1 ? 'a step' : Math.abs(d) === 2 ? 'a skip' : 'a leap';
  return `${size} ${d > 0 ? 'up' : 'down'}`;
};

/** Start on white key number `start` (0 = middle C) and move by each amount in `moves`; every note is labelled with the move. */
function walk(start: number, moves: number[]): Target[] {
  const out = [noteTarget(W[start], { note: 'start here' })];
  let at = start;
  for (const d of moves) {
    at += d;
    out.push(noteTarget(W[at], { note: word(d), hint: `From the last key, that is ${word(d)}.` }));
  }
  return out;
}

const lit = { keys: true, staff: true } as const;

const steps: Step[] = [
  {
    kind: 'info',
    title: 'Steps, skips and leaps',
    body: [
      'The distance between two notes is called an interval. You can read melodies much faster by seeing the shape instead of naming every note.',
    ],
    list: [
      'A step goes to the very next white key: Do to Re (C to D). On the staff, from a line to the next space.',
      'A skip jumps over one white key: Do to Mi (C to E). On the staff, from line to line or space to space.',
      'A leap is anything bigger: Do to Sol (C to G), for example.',
      'Repeated note: the same key again.',
    ],
  },
  {
    kind: 'play',
    title: 'Steps up',
    body: 'Each key is a step from the last one. Watch the shape on the staff.',
    show: lit,
    keyboard: [60, 72],
    targets: walk(0, [1, 1, 1, 1]),
  },
  {
    kind: 'play',
    title: 'Steps down',
    show: lit,
    keyboard: [60, 72],
    targets: walk(5, [-1, -1, -1, -1]),
  },
  {
    kind: 'play',
    title: 'Skips up',
    body: 'Skip a key each time: your finger lands on every other white key. On the staff, line to line.',
    show: lit,
    keyboard: [60, 76],
    targets: walk(0, [2, 2, 2]),
  },
  {
    kind: 'play',
    title: 'Skips down',
    show: lit,
    keyboard: [60, 76],
    targets: walk(6, [-2, -2, -2]),
  },
  {
    kind: 'play',
    title: 'Step or skip?',
    body: 'A mix. Look at each label: it tells you what kind of move it is.',
    show: lit,
    keyboard: [60, 76],
    targets: walk(0, [1, 2, -1, 2, -2, -1, 1]),
  },
  {
    kind: 'play',
    title: 'Leaps',
    body: 'Bigger jumps. Look with your eyes first, then move your whole hand.',
    show: lit,
    keyboard: [60, 79],
    targets: walk(0, [4, -3, 5, -4]),
  },
  {
    kind: 'play',
    title: 'Read the shape',
    body: 'The keys are not lit now. Read the sheet music, with the names under the notes: is the next note a step, a skip or a leap away?',
    names: false,
    show: { staff: true, labels: 'all' },
    keyboard: [60, 79],
    hintAfterMs: 12000,
    targets: walk(2, [1, 1, -2, 2, 1, -1, -1, 3, -2]),
  },
];

export const stepsAndSkips: LessonDef = {
  id: 'steps-and-skips',
  title: 'Steps, skips and leaps',
  summary: 'See melodies as shapes: notes next to each other, notes one apart, and big jumps.',
  goals: [
    'Tell a step, a skip and a leap apart on the keyboard and on the staff',
    'Move up and down the keys by steps and by skips',
    'Read a short melody by its shape instead of note by note',
  ],
  steps,
};
