import { midiToName, noteName } from '../../domain/notes';
import type { KeyHighlight } from '../../features/keyboard/Keyboard';
import { LANDMARKS } from '../../guide/landmarks';
import { anyKey, KEYBOARD_RANGE, keyTarget, whiteKeys } from '../../guide/targets';
import type { LessonDef } from '../types';

const inTwos = (m: number) => m % 12 === 1 || m % 12 === 3;
const inThrees = (m: number) => [6, 8, 10].includes(m % 12);
const isC = (m: number) => m % 12 === 0;
const MIDDLE_C = 60;

const C_TO_C = whiteKeys(60, 72);

// The first octave above middle C, to show on a picture.
const octaveKeys: Record<number, KeyHighlight> = {};
for (const m of C_TO_C) octaveKeys[m] = { kind: m % 12 === 0 ? 'current' : 'next' };

export const keyboardBasics: LessonDef = {
  id: 'keyboard-basics',
  title: 'Meet the keyboard',
  summary: 'Learn the landmarks of the keyboard by playing them. No counting keys, ever.',
  goals: [
    'Spot the groups of 2 and 3 black keys instantly',
    'Find any Do (C), and middle Do, on your piano',
    'Play the white keys from Do (C) up to the next Do, and back down',
  ],
  steps: [
    {
      kind: 'info',
      title: 'Sit down at your keyboard',
      body: [
        'This course is played on your piano, not on this screen. The app tells you what to play, listens to your keyboard, and moves on by itself with a little chime when you get it right.',
        'Sit centered in front of the keyboard, with your forearms level with the keys.',
      ],
    },
    {
      kind: 'play',
      title: 'Black keys come in groups',
      body: 'Look at the black keys: they come in groups of two and groups of three.',
      keyboard: KEYBOARD_RANGE,
      hintAfterMs: 12000,
      targets: [0, 1, 2].map(() =>
        anyKey('Play any black key from a group of TWO', inTwos, 'The pairs are the two black keys next to each other.'),
      ),
    },
    {
      kind: 'play',
      title: 'Groups of three',
      keyboard: KEYBOARD_RANGE,
      hintAfterMs: 12000,
      targets: [0, 1, 2].map(() =>
        anyKey('Play any black key from a group of THREE', inThrees, 'The groups of three are the black keys in threes.'),
      ),
    },
    {
      kind: 'play',
      title: 'Find a Do (C)',
      body: 'Use the groups as landmarks. You never have to count keys.',
      keyboard: KEYBOARD_RANGE,
      hintAfterMs: 12000,
      targets: [0, 1, 2].map(() => anyKey('Play a Do (C): the white key just LEFT of a pair of black keys', isC, LANDMARKS[0])),
    },
    {
      kind: 'play',
      title: 'Middle Do (C)',
      body: 'Middle Do, also called middle C, is the Do closest to the middle of your keyboard. Most beginner songs start near it.',
      keyboard: KEYBOARD_RANGE,
      hintAfterMs: 10000,
      targets: [keyTarget(MIDDLE_C, 'Play middle Do (C)')],
    },
    {
      kind: 'info',
      title: 'From Do to the next Do',
      body: [
        'Every white key has two names, and both are worth knowing: Do Re Mi Fa Sol La Si, or the letters C D E F G A B. Then they start again.',
        'Do and C are the same key, Re and D too, and so on. The app shows you both.',
      ],
      keyboard: { from: 60, to: 72, keys: octaveKeys },
    },
    {
      kind: 'play',
      title: 'Up from middle Do',
      body: 'Play the white keys one after another, going right.',
      show: { keys: true },
      targets: C_TO_C.map((m) => keyTarget(m)),
    },
    {
      kind: 'play',
      title: 'Up again: find them yourself',
      body: `Same notes, but the keys are no longer lit. Think: ${C_TO_C.slice(0, 4).map(noteName).join(' ')}… or ${C_TO_C.slice(0, 4).map(midiToName).join(' ')}…`,
      names: false,
      keyboard: [60, 72],
      hintAfterMs: 8000,
      targets: C_TO_C.map((m) => keyTarget(m)),
    },
    {
      kind: 'play',
      title: 'And back down',
      names: false,
      keyboard: [60, 72],
      hintAfterMs: 8000,
      targets: [...C_TO_C].reverse().map((m) => keyTarget(m)),
    },
  ],
};
