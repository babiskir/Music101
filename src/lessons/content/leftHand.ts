import { bothNames } from '../../domain/notes';
import type { Finger } from '../../domain/song';
import type { KeyHighlight } from '../../features/keyboard/Keyboard';
import { quizTargets, whiteKeys } from '../../guide/targets';
import type { Choice, Target } from '../../guide/types';
import type { LessonDef } from '../types';
import { noteTarget, pick, readTune } from './builders';
import { BUNS, CLAIR, MARY, ODE } from './reading';

/**
 * The left hand and the bass clef, in the same small steps as the treble staff:
 *   1 the bass clef (three notes, then five)  2 left-hand tunes and landmarks  3 the grand staff, hands taking turns
 */

const OCTAVE = 12;
const LH = whiteKeys(48, 55); // Do to Sol (C to G) below middle Do: the left-hand position
const LH_FINGER: Record<number, Finger> = { 48: 5, 50: 4, 52: 3, 53: 2, 55: 1 };
const lit = { keys: true, staff: true, clef: 'bass' } as const;
const bassStaff = { staff: true, clef: 'bass' } as const;

/** A left-hand note to play, with the finger named. */
const lhNote = (m: number) => noteTarget(m, { finger: LH_FINGER[m] });

const fingerPicture = (midis: number[]): Record<number, KeyHighlight> =>
  Object.fromEntries(midis.map((m) => [m, { kind: 'current', label: ['', 'thumb', 'index', 'middle', 'ring', 'pinky'][LH_FINGER[m]] }]));

// ---------------------------------------------------------------- 1. the bass clef

export const bassClef: LessonDef = {
  id: 'bass-clef',
  title: 'The bass clef',
  summary: 'The left hand reads from its own staff. Start with Do, Re and Mi (C, D, E), then add Fa and Sol (F, G).',
  goals: [
    'Recognise the bass clef and its Fa (F) line',
    'Find Do to Sol (C to G) below middle Do on the bass staff',
    'Play them with the left hand, with the names fading away',
  ],
  steps: [
    {
      kind: 'info',
      title: 'A staff for the left hand',
      body: [
        'Low notes are written on a second staff, with a different sign at the start: the bass clef. It looks like a curl with two dots.',
        'The two dots sit either side of the fourth line. That line is Fa (F), so the bass clef is also called the F clef.',
        'Everything else you know still works: higher on the page is higher on the keyboard, and lines and spaces take turns.',
      ],
      staff: { notes: [48, 50, 52], labels: 'all', clef: 'bass' },
      keyboard: { from: 48, to: 60, keys: fingerPicture([48, 50, 52]) },
    },
    {
      kind: 'info',
      title: 'Your left hand in place',
      body: [
        'Put your left pinky on the Do (C) one octave below middle Do. Then one finger per white key: ring on Re (D), middle on Mi (E), index on Fa (F), thumb on Sol (G).',
        'Three notes to start with. Do (C) is in the second space from the bottom, Re (D) on the middle line, Mi (E) in the third space.',
      ],
      keyboard: { from: 48, to: 60, keys: fingerPicture(LH) },
    },
    {
      kind: 'play',
      title: 'Up the three notes',
      body: 'Pinky, ring, middle. Watch the notes climb the bass staff.',
      show: { ...lit, fingers: true, labels: 'all' },
      keyboard: [48, 60],
      targets: () => [48, 50, 52].map(lhNote),
    },
    {
      kind: 'play',
      title: 'Up and down',
      show: { ...lit, fingers: true, labels: 'all' },
      keyboard: [48, 60],
      targets: () => [48, 50, 52, 50, 48, 50, 52].map(lhNote),
    },
    {
      kind: 'play',
      title: 'Read the note: names help you',
      body: 'A note on the bass staff with its names below. Play it with your left hand.',
      names: false,
      keyboard: [48, 60],
      show: { labels: 'all' },
      hintAfterMs: 12000,
      targets: () => quizTargets([48, 50, 52], 5, 'staff', 'bass'),
    },
    {
      kind: 'play',
      title: 'Read the note: on your own',
      body: 'No names now. Second space, middle line, third space.',
      names: false,
      keyboard: [48, 60],
      hintAfterMs: 12000,
      targets: () => quizTargets([48, 50, 52], 6, 'staff', 'bass'),
    },
    {
      kind: 'info',
      title: 'Two more: Fa and Sol',
      body: [
        'Fa (F) sits on the fourth line, right between the two dots of the clef: the easiest note to find in the bass clef. Sol (G) is in the top space.',
        'Now you have all five notes under your left hand.',
      ],
      staff: { notes: LH, labels: 'all', clef: 'bass' },
      keyboard: { from: 48, to: 60, keys: fingerPicture(LH) },
    },
    {
      kind: 'play',
      title: 'Climb the bass staff',
      show: { ...lit, fingers: true, labels: 'all' },
      keyboard: [48, 60],
      targets: () => LH.map(lhNote),
    },
    {
      kind: 'play',
      title: 'Come back down',
      show: { ...lit, fingers: true, labels: 'first' },
      keyboard: [48, 60],
      targets: () => [...LH].reverse().map(lhNote),
    },
    {
      kind: 'play',
      title: 'Five notes: fewer helpers',
      body: 'Only the first note shows its names.',
      names: false,
      keyboard: [48, 60],
      show: { labels: 'first' },
      hintAfterMs: 12000,
      targets: () => quizTargets(LH, 6, 'staff', 'bass'),
    },
    {
      kind: 'play',
      title: 'Five notes: on your own',
      names: false,
      keyboard: [48, 60],
      hintAfterMs: 12000,
      targets: () => quizTargets(LH, 8, 'staff', 'bass'),
    },
  ],
};

// ---------------------------------------------------------------- 2. left-hand tunes

const BASS_LANDMARKS = [43, 48, 53, 60]; // low Sol (bottom line), Do (second space), Fa (the dots), middle Do (above)
const down = (midis: number[]) => midis.map((m) => m - OCTAVE);

export const leftHandTunes: LessonDef = {
  id: 'left-hand-tunes',
  title: 'Left-hand tunes',
  summary: 'Four landmarks on the bass staff, then four tunes you know, read and played with the left hand.',
  goals: [
    'Recognise the landmarks of the bass staff straight away',
    'Read a whole tune from the bass staff',
    'Play with the left hand without looking at the names',
  ],
  steps: [
    {
      kind: 'info',
      title: 'Landmarks on the bass staff',
      body: ['Just like on the treble staff, a few landmarks let you read the other notes as steps and skips from them.'],
      list: [
        'Low Sol (G): the bottom line.',
        'Do (C): the second space, under your left pinky.',
        'Fa (F): the fourth line, between the two dots of the clef.',
        'Middle Do (C): its own short line ABOVE the bass staff. It is the same key as the middle Do under the treble staff.',
      ],
      staff: { notes: BASS_LANDMARKS, labels: 'all', clef: 'bass' },
      keyboard: { from: 43, to: 60, keys: Object.fromEntries(BASS_LANDMARKS.map((m) => [m, { kind: 'current' }])) },
    },
    {
      kind: 'play',
      title: 'Play the landmarks',
      show: { ...lit, labels: 'all' },
      keyboard: [43, 60],
      targets: () => [43, 48, 53, 60, 53, 48, 43].map((m) => noteTarget(m)),
    },
    {
      kind: 'play',
      title: 'Landmarks without help',
      names: false,
      keyboard: [43, 60],
      hintAfterMs: 12000,
      targets: () => quizTargets(BASS_LANDMARKS, 6, 'staff', 'bass'),
    },
    {
      kind: 'info',
      title: 'Tunes for the left hand',
      body: [
        'Back to your left-hand position: pinky on Do (C), thumb on Sol (G). The tunes you read with the right hand now sound one octave lower, from the bass staff.',
        'Remember: the left hand goes the other way. Going up, you move from the pinky towards the thumb.',
      ],
      keyboard: { from: 48, to: 60, keys: fingerPicture(LH) },
    },
    {
      kind: 'play',
      title: 'Mary had a little lamb',
      body: 'The keys are lit and the names are on the sheet.',
      show: { ...lit, labels: 'all' },
      keyboard: [48, 60],
      names: false,
      targets: () => readTune(down(MARY), 'Play the lit key'),
    },
    {
      kind: 'play',
      title: 'Hot cross buns',
      body: 'Names on the sheet, keys not lit.',
      show: { ...bassStaff, labels: 'all' },
      keyboard: [48, 60],
      names: false,
      hintAfterMs: 12000,
      targets: () => readTune(down(BUNS)),
    },
    {
      kind: 'play',
      title: 'Au clair de la lune',
      body: 'Only the first note has its names.',
      show: { ...bassStaff, labels: 'first' },
      keyboard: [48, 60],
      names: false,
      hintAfterMs: 12000,
      targets: () => readTune(down(CLAIR)),
    },
    {
      kind: 'play',
      title: 'Ode to Joy, no names',
      body: 'Just the bass staff. Look at the shape: steps, mostly.',
      show: bassStaff,
      keyboard: [48, 60],
      names: false,
      hintAfterMs: 12000,
      targets: () => readTune(down(ODE)),
    },
  ],
};

// ---------------------------------------------------------------- 3. the grand staff

const RIGHT = whiteKeys(60, 67);
const handOf = (m: number) => (m >= 60 ? 'right hand' : 'left hand');
const grand = { staff: true, clef: 'grand' } as const;

/** A note to play, with the hand that plays it. */
const handNote = (m: number) => noteTarget(m, { note: handOf(m) });
/** A note to read from the grand staff: the prompt says which hand, but not which note. */
const readHand = (midis: number[]): Target[] =>
  readTune(midis).map((t) => ({ ...t, label: `Play the next note: ${handOf(t.midi!)}` }));

const whichHandChoices = (): Choice[] =>
  Array.from({ length: 6 }, () => {
    const m = pick([...whiteKeys(45, 57), ...whiteKeys(62, 74)]);
    return {
      prompt: 'Which hand plays this note?',
      notes: [m],
      clef: 'grand',
      options: ['Left hand', 'Right hand'],
      answer: m >= 60 ? 1 : 0,
      hint: 'Notes on the top staff (treble clef) are for the right hand; notes on the bottom staff (bass clef) for the left.',
    };
  });

const sameNoteChoices = (): Choice[] =>
  Array.from({ length: 5 }, () => {
    const right = pick(RIGHT);
    const left = right - OCTAVE;
    const options = [right, ...RIGHT.filter((m) => m !== right).sort(() => Math.random() - 0.5).slice(0, 2)].map(bothNames).sort(() => Math.random() - 0.5);
    return {
      prompt: 'The two hands play the same note, one octave apart. Which note is it?',
      notes: [left, right],
      clef: 'grand',
      labels: 'none',
      options,
      answer: options.indexOf(bothNames(right)),
      hint: 'Read one of them: the left hand\'s note on the bass staff, or the right hand\'s on the treble staff.',
    };
  });

export const grandStaff: LessonDef = {
  id: 'grand-staff',
  title: 'The grand staff: two hands',
  summary: 'Piano music joins the two staves into one. Read which hand plays each note, then let the hands take turns.',
  goals: [
    'Read the grand staff: treble for the right hand, bass for the left',
    'Know that middle Do (C) sits between the two staves',
    'Play a tune where the two hands take turns',
  ],
  steps: [
    {
      kind: 'info',
      title: 'Two staves, joined together',
      body: [
        'Piano music uses both staves at once, joined on the left by a brace. The top staff (treble clef) is for the right hand, the bottom staff (bass clef) for the left.',
        'Middle Do (C) sits right between them: on a short line under the treble staff, or above the bass staff. It is the same key either way.',
      ],
      staff: { notes: [48, 52, 55, 60, 64, 67, 72], labels: 'all', clef: 'grand' },
      keyboard: { from: 48, to: 72, keys: { 48: { kind: 'next', label: 'left' }, 60: { kind: 'current' }, 72: { kind: 'next', label: 'right' } } },
    },
    {
      kind: 'choose',
      title: 'Which hand?',
      body: 'A note on the grand staff. Which hand plays it?',
      choices: whichHandChoices,
    },
    {
      kind: 'choose',
      title: 'The same note, twice',
      body: 'Both hands, the same name, one octave apart.',
      choices: sameNoteChoices,
    },
    {
      kind: 'info',
      title: 'Taking turns',
      body: [
        'Put both hands in position: left pinky on the Do (C) below middle Do, right thumb on middle Do. The thumbs are close together in the middle.',
        'First the hands take turns: one plays, then the other answers. Playing at the same time comes later.',
      ],
      keyboard: {
        from: 48,
        to: 72,
        keys: {
          ...fingerPicture(LH),
          60: { kind: 'next', label: 'thumb' }, 62: { kind: 'next', label: 'index' }, 64: { kind: 'next', label: 'middle' }, 65: { kind: 'next', label: 'ring' }, 67: { kind: 'next', label: 'pinky' },
        },
      },
    },
    {
      kind: 'play',
      title: 'Echo: left, then right',
      body: 'The left hand plays three notes; the right hand answers with the same three, one octave higher.',
      show: { ...grand, keys: true, labels: 'all' },
      keyboard: [48, 72],
      targets: () => [48, 50, 52, 60, 62, 64, 52, 53, 55, 64, 65, 67].map(handNote),
    },
    {
      kind: 'play',
      title: 'Echo: right, then left',
      show: { ...grand, keys: true, labels: 'first' },
      keyboard: [48, 72],
      targets: () => [67, 65, 64, 55, 53, 52, 64, 62, 60, 52, 50, 48].map(handNote),
    },
    {
      kind: 'play',
      title: 'Mary, two hands taking turns',
      body: 'The right hand starts, the left hand answers. Keys not lit: read which staff each note is on.',
      show: { ...grand, labels: 'first' },
      keyboard: [48, 72],
      names: false,
      hintAfterMs: 12000,
      targets: () => readHand([64, 62, 60, 62, 64, 64, 64, 50, 50, 50, 64, 67, 67]),
    },
    {
      kind: 'play',
      title: 'Ode to Joy, two hands',
      body: 'The right hand plays the first line, the left hand the second, from the grand staff alone.',
      show: grand,
      keyboard: [48, 72],
      names: false,
      hintAfterMs: 12000,
      targets: () => readHand([...ODE.slice(0, 8), ...down(ODE.slice(8))]),
    },
  ],
};

export const leftHandLessons: LessonDef[] = [bassClef, leftHandTunes, grandStaff];
