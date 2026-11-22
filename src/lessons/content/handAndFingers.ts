import type { Finger } from '../../domain/song';
import type { KeyHighlight } from '../../features/keyboard/Keyboard';
import { fingerTarget } from '../../guide/targets';
import type { Step } from '../../guide/types';
import type { LessonDef } from '../types';
import { FINGERS, POSITIONS, POSTURE_TIPS, type Hand } from './positions';

const targets = (hand: Hand, fingers: Finger[]) => () => fingers.map((f) => fingerTarget(POSITIONS[hand].keys, f));

function handPicture(hand: Hand): Record<number, KeyHighlight> {
  const keys: Record<number, KeyHighlight> = {};
  for (const f of FINGERS) keys[POSITIONS[hand].keys[f]] = { kind: 'current', label: String(f) };
  return keys;
}

const right = POSITIONS.right;
const left = POSITIONS.left;

const steps: Step[] = [
  {
    kind: 'info',
    title: 'Your right hand',
    body: [right.description, 'The number on each lit key is the finger that rests there: 1 = thumb … 5 = pinky.'],
    list: POSTURE_TIPS,
    keyboard: { from: right.range[0], to: right.range[1], keys: handPicture('right') },
  },
  {
    kind: 'play',
    title: 'Thumb to pinky',
    body: 'Press each key with the finger shown, one after the other.',
    show: { keys: true, fingers: true },
    keyboard: right.range,
    targets: targets('right', [1, 2, 3, 4, 5]),
  },
  {
    kind: 'play',
    title: 'Pinky to thumb',
    show: { keys: true, fingers: true },
    keyboard: right.range,
    targets: targets('right', [5, 4, 3, 2, 1]),
  },
  {
    kind: 'play',
    title: 'Up and down',
    show: { keys: true, fingers: true },
    keyboard: right.range,
    targets: targets('right', [1, 2, 3, 4, 5, 4, 3, 2, 1]),
  },
  {
    kind: 'play',
    title: 'Skips',
    body: 'Now the keys are not lit: your hand knows where its fingers are.',
    names: false,
    show: { fingers: true },
    keyboard: right.range,
    hintAfterMs: 10000,
    targets: targets('right', [1, 3, 2, 4, 3, 5, 4, 2]),
  },
  {
    kind: 'play',
    title: 'Thumb to pinky leaps',
    names: false,
    show: { fingers: true },
    keyboard: right.range,
    hintAfterMs: 10000,
    targets: targets('right', [1, 5, 1, 5, 2, 4, 2, 4]),
  },
  {
    kind: 'play',
    title: 'The fingering of Ode to Joy',
    body: 'This is the finger pattern of your first song.',
    names: false,
    show: { fingers: true },
    keyboard: right.range,
    hintAfterMs: 10000,
    targets: targets('right', [3, 3, 4, 5, 5, 4, 3, 2, 1, 1, 2, 3, 3, 2, 2]),
  },
  {
    kind: 'info',
    title: 'Your left hand',
    body: [left.description],
    keyboard: { from: left.range[0], to: left.range[1], keys: handPicture('left') },
  },
  {
    kind: 'play',
    title: 'Left hand: pinky to thumb',
    body: 'Going up the keyboard, the left hand goes from 5 down to 1.',
    show: { keys: true, fingers: true },
    keyboard: left.range,
    targets: targets('left', [5, 4, 3, 2, 1]),
  },
  {
    kind: 'play',
    title: 'Left hand: up and down',
    names: false,
    show: { fingers: true },
    keyboard: left.range,
    hintAfterMs: 10000,
    targets: targets('left', [5, 4, 3, 2, 1, 2, 3, 4, 5]),
  },
];

export const handAndFingers: LessonDef = {
  id: 'hand-position',
  title: 'Hand & fingers',
  summary: 'Where each finger goes, then drills with the keys lit up and without.',
  goals: [
    'Place your right and your left hand in five-finger position',
    'Know the finger numbers: 1 = thumb … 5 = pinky',
    'Play any key in the position with the right finger, without looking',
  ],
  steps,
};
