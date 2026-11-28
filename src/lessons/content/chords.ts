import { bothNames } from '../../domain/notes';
import type { Finger } from '../../domain/song';
import type { KeyHighlight } from '../../features/keyboard/Keyboard';
import type { Step, Target } from '../../guide/types';
import type { LessonDef } from '../types';
import { noteTarget } from './builders';

type Hand = 'right' | 'left';

/** The three chords used here, as the lowest note of each: Do chord, Fa chord, Sol chord. */
const ROOTS = { Do: 60, Fa: 65, Sol: 67 } as const;
const OCTAVE = 12;

/** Major triad: the root, then 4 and 7 semitones above it. For Do, Fa and Sol that is every other white key. */
const triad = (root: number): number[] => [root, root + 4, root + 7];

/** Finger on each of the three notes: the right hand goes thumb-middle-pinky, the left the other way. */
const FINGERS: Record<Hand, Finger[]> = { right: [1, 3, 5], left: [5, 3, 1] };

/** `root` is the right-hand chord; the left hand plays the same chord one octave down. */
const notesFor = (root: number, hand: Hand): number[] => triad(hand === 'right' ? root : root - OCTAVE);

const upAndDown = (root: number, hand: Hand): Target[] => {
  const notes = notesFor(root, hand);
  const fingers = FINGERS[hand];
  const order = [0, 1, 2, 1, 0];
  return order.map((i) =>
    noteTarget(notes[i], { finger: fingers[i], hint: 'Each note of the chord skips one white key.' }),
  );
};

const rangeFor = (root: number, hand: Hand): [number, number] => {
  const low = hand === 'right' ? root : root - OCTAVE;
  return [low, low + 12];
};

const chordStep = (root: number, hand: Hand, help = true): Step => ({
  kind: 'play',
  title: `${bothNames(root)} chord, ${hand} hand`,
  body: help
    ? 'Play the three notes one after the other, up and back down.'
    : 'The keys are not lit. Find the chord by its shape: skip a key between the notes.',
  names: help,
  show: { keys: help, fingers: true },
  keyboard: rangeFor(root, hand),
  hintAfterMs: 10000,
  targets: () => upAndDown(root, hand),
});

function chordPicture(root: number): Record<number, KeyHighlight> {
  const keys: Record<number, KeyHighlight> = {};
  const [a, b, c] = triad(root);
  keys[a] = { kind: 'current', label: 'root' };
  keys[b] = { kind: 'current', label: 'middle' };
  keys[c] = { kind: 'current', label: 'top' };
  return keys;
}

/** Do, Fa, Sol, Do: each chord broken upwards. */
function progression(hand: Hand): () => Target[] {
  return () =>
    (['Do', 'Fa', 'Sol', 'Do'] as const).flatMap((name) => {
      const notes = notesFor(ROOTS[name], hand);
      return notes.map((m, i) =>
        noteTarget(m, { finger: FINGERS[hand][i], note: i === 0 ? `${bothNames(ROOTS[name])} chord` : undefined }),
      );
    });
}

const steps: Step[] = [
  {
    kind: 'info',
    title: 'What is a chord?',
    body: [
      'A chord is three or more notes that sound good together. Melodies are the tune; chords are the harmony underneath.',
      'The simplest chord is built from a note and the next two "every-other" keys above it. Start on a white key, skip a key, play the next, skip a key, play the next.',
    ],
    list: [
      ...[ROOTS.Do, ROOTS.Fa, ROOTS.Sol].map((root) => `${bothNames(root)} chord: ${triad(root).map(bothNames).join(', ')}`),
      'Those three chords are enough to accompany hundreds of songs.',
      'First you play the notes one at a time, called a broken chord (or arpeggio). Later, all three at once.',
    ],
    keyboard: { from: 60, to: 72, keys: chordPicture(ROOTS.Do) },
  },
  chordStep(ROOTS.Do, 'right'),
  {
    kind: 'info',
    title: 'The Fa (F) chord',
    body: ['Slide your hand up: thumb on Fa (F), middle finger on La (A), pinky on Do (C). Same shape, new home.'],
    keyboard: { from: 65, to: 77, keys: chordPicture(ROOTS.Fa) },
  },
  chordStep(ROOTS.Fa, 'right'),
  {
    kind: 'info',
    title: 'The Sol (G) chord',
    body: ['Thumb on Sol (G), middle finger on Si (B), pinky on Re (D).'],
    keyboard: { from: 67, to: 79, keys: chordPicture(ROOTS.Sol) },
  },
  chordStep(ROOTS.Sol, 'right'),
  chordStep(ROOTS.Do, 'right', false),
  chordStep(ROOTS.Fa, 'right', false),
  chordStep(ROOTS.Sol, 'right', false),
  {
    kind: 'info',
    title: 'Left hand chords',
    body: [
      'Chords usually live in the left hand, under the melody. The left hand plays the same chords an octave lower, and the fingers run the other way: pinky on the lowest note, thumb on the highest.',
    ],
    keyboard: { from: 48, to: 60, keys: chordPicture(ROOTS.Do - OCTAVE) },
  },
  chordStep(ROOTS.Do, 'left'),
  chordStep(ROOTS.Fa, 'left'),
  chordStep(ROOTS.Sol, 'left'),
  {
    kind: 'info',
    title: 'Block chords',
    body: [
      'Try pressing all three notes of a chord together, with the pinky, middle finger and thumb at the same time. This is not graded, just listen to how full it sounds. Press any key when you are ready to continue.',
    ],
  },
  {
    kind: 'play',
    title: 'Chord progression, right hand',
    body: 'Four chords in a row: Do, Fa, Sol, Do (C, F, G, C). Each is played as a broken chord, going up.',
    show: { keys: true, fingers: true },
    keyboard: [60, 79],
    targets: progression('right'),
  },
  {
    kind: 'play',
    title: 'Chord progression, left hand',
    show: { keys: true, fingers: true },
    keyboard: [48, 67],
    targets: progression('left'),
  },
];

export const chords: LessonDef = {
  id: 'chords',
  title: 'Your first chords',
  summary: 'Three notes at a time: the Do (C), Fa (F) and Sol (G) chords, played one note after another in both hands.',
  goals: [
    'Know that a chord is built by skipping every other white key',
    'Play the Do (C), Fa (F) and Sol (G) chords as broken chords with the right fingers',
    'Move between those chords in a short progression',
  ],
  steps,
};
