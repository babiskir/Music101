import { FINGER_NAMES, type Finger } from '../../domain/song';
import type { KeyHighlight } from '../../features/keyboard/Keyboard';
import type { Step } from '../../guide/types';
import type { LessonDef } from '../types';
import { noteTarget } from './builders';

const FINGERS: Finger[] = [1, 2, 3, 4, 5];

/** G position, right hand: thumb on G, then one finger per white key: A B C D. */
const G_POSITION: Record<Finger, number> = { 1: 67, 2: 69, 3: 71, 4: 72, 5: 74 };
const G_RANGE: [number, number] = [67, 76];

/** The C major scale, right hand, going up: the thumb tucks under after the middle finger. */
const SCALE_UP: Array<[number, Finger]> = [
  [60, 1],
  [62, 2],
  [64, 3],
  [65, 1],
  [67, 2],
  [69, 3],
  [71, 4],
  [72, 5],
];
const SCALE_DOWN: Array<[number, Finger]> = [...SCALE_UP].reverse(); // the same fingers, in reverse

const fingered = (notes: Array<[number, Finger]>) => () => notes.map(([m, f]) => noteTarget(m, { finger: f }));

function picture(position: Record<Finger, number>): Record<number, KeyHighlight> {
  const keys: Record<number, KeyHighlight> = {};
  for (const f of FINGERS) keys[position[f]] = { kind: 'current', label: FINGER_NAMES[f] };
  return keys;
}

const gTargets = (order: Finger[]) => () => order.map((f) => noteTarget(G_POSITION[f], { finger: f }));

const steps: Step[] = [
  {
    kind: 'info',
    title: 'A new home: G position',
    body: [
      'Your hand does not have to live on middle C. Put the thumb on G instead and each finger still gets one white key: G A B C D, thumb to pinky.',
      'It is the same hand shape in a new place. Moving a position is how you play higher or lower melodies without changing the fingering.',
    ],
    keyboard: { from: G_RANGE[0], to: G_RANGE[1], keys: picture(G_POSITION) },
  },
  {
    kind: 'play',
    title: 'Thumb to pinky, from G',
    show: { keys: true, fingers: true },
    keyboard: G_RANGE,
    targets: gTargets([1, 2, 3, 4, 5]),
  },
  {
    kind: 'play',
    title: 'Up and back down',
    show: { keys: true, fingers: true },
    keyboard: G_RANGE,
    targets: gTargets([1, 2, 3, 4, 5, 4, 3, 2, 1]),
  },
  {
    kind: 'play',
    title: 'Without the lit keys',
    body: 'Your hand has learned the shape. Find the keys by finger.',
    names: false,
    show: { fingers: true },
    keyboard: G_RANGE,
    hintAfterMs: 10000,
    targets: gTargets([1, 3, 2, 4, 3, 5, 4, 2, 1, 5, 1]),
  },
  {
    kind: 'info',
    title: 'The C major scale',
    body: [
      'A scale is all the white keys in a row, from one C to the next. It sounds like "do re mi fa sol la ti do".',
      'Your hand only has five fingers, so on the way up the thumb tucks under the hand after the middle finger. Keep your wrist loose and let the thumb glide.',
    ],
    list: [
      'Going up: thumb, index, middle, then thumb again, index, middle, ring, pinky.',
      'Coming down: the reverse. After the thumb the middle finger crosses over it.',
    ],
    keyboard: { from: 60, to: 72, names: true },
  },
  {
    kind: 'play',
    title: 'Scale up: first three notes',
    body: 'Thumb, index, middle. Then pause, ready for the tuck.',
    show: { keys: true, fingers: true },
    keyboard: [60, 72],
    targets: fingered(SCALE_UP.slice(0, 3)),
  },
  {
    kind: 'play',
    title: 'Scale up: the thumb tucks under',
    body: 'Start on the middle finger on E, then thumb under to F.',
    show: { keys: true, fingers: true },
    keyboard: [60, 72],
    targets: fingered(SCALE_UP.slice(2, 5)),
  },
  {
    kind: 'play',
    title: 'The whole scale, going up',
    show: { keys: true, fingers: true, staff: true },
    keyboard: [60, 72],
    targets: fingered(SCALE_UP),
  },
  {
    kind: 'play',
    title: 'The whole scale, coming down',
    show: { keys: true, fingers: true, staff: true },
    keyboard: [60, 72],
    targets: fingered(SCALE_DOWN),
  },
  {
    kind: 'play',
    title: 'Up and down, from the sheet',
    body: 'The keys are not lit. Follow the fingers and the sheet music.',
    names: false,
    show: { fingers: true, staff: true },
    keyboard: [60, 72],
    hintAfterMs: 12000,
    targets: fingered([...SCALE_UP, ...SCALE_DOWN.slice(1)]),
  },
];

export const newPositions: LessonDef = {
  id: 'new-positions',
  title: 'New positions and the scale',
  summary: 'Move your hand to G, then play the C major scale with the thumb tucking under.',
  goals: [
    'Place the right hand in G position (thumb on G)',
    'Understand that a position is a hand shape you can move',
    'Play the C major scale up and down with the right fingering',
  ],
  steps,
};
