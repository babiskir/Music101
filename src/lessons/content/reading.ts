import { midiToName } from '../../domain/notes';
import { anyKey, quizTargets, whiteKeys } from '../../guide/targets';
import type { Choice, Target } from '../../guide/types';
import type { LessonDef } from '../types';
import { noteTarget, pick, readTune, syllableTarget } from './builders';

/**
 * The road into reading music, in small steps. One new idea per lesson:
 *   1 higher or lower (no names)  2 do re mi  3 three notes  4 five notes  5 short tunes
 *   6 the notes above  7 landmarks   (8 shortcuts and sharps lives in readingNotes.ts)
 * Letters printed under the notes fade away inside each lesson: all, then the first, then none.
 */

const C_TO_G = whiteKeys(60, 67); // C D E F G: the five-finger position
const C_TO_C = whiteKeys(60, 72);

const lit = { keys: true, staff: true } as const;

// ---------------------------------------------------------------- 1. higher or lower

const higherLowerChoices = (): Choice[] =>
  Array.from({ length: 5 }, () => {
    const pool = whiteKeys(60, 76);
    const a = pick(pool);
    const b = pick(pool.filter((m) => m !== a));
    return {
      prompt: 'Is the second note higher or lower than the first?',
      notes: [a, b],
      options: ['Higher', 'Lower'],
      answer: b > a ? 0 : 1,
      hint: 'A higher note sits higher on the staff, and further to the right on the keyboard. Press "Hear it" too.',
    };
  });

const higherLowerTargets = (): Target[] =>
  Array.from({ length: 3 }, () => {
    const base = pick(whiteKeys(62, 74));
    const higher = Math.random() < 0.5;
    return [
      noteTarget(base, { note: 'play it' }),
      anyKey(
        higher ? 'Now any key HIGHER' : 'Now any key LOWER',
        higher ? (m) => m > base : (m) => m < base,
        higher ? 'Go to the right on the keyboard.' : 'Go to the left on the keyboard.',
      ),
    ];
  }).flat();

export const higherOrLower: LessonDef = {
  id: 'higher-or-lower',
  title: 'Higher or lower?',
  summary: 'The first idea of the staff: higher on the page means higher on the keyboard. No names yet.',
  goals: [
    'See that the staff is a picture of the keyboard: up is higher, down is lower',
    'Tell whether a note is higher or lower than the one before',
    'Follow a few notes going up and down, with the keys lit',
  ],
  steps: [
    {
      kind: 'info',
      title: 'The staff is a picture of the keyboard',
      body: [
        'Sheet music looks hard, but it is built on one simple idea: HIGHER on the page means HIGHER on the piano (further to the right).',
        'Here are three notes going up. Listen to the picture: low, middle, high. You do not need any names yet.',
      ],
      staff: { notes: [60, 64, 67] },
      keyboard: { from: 60, to: 67, names: false },
    },
    {
      kind: 'choose',
      title: 'Higher or lower? Look and listen',
      body: 'Tap the answer. Use "Hear it" if you want to check with your ears.',
      choices: higherLowerChoices,
    },
    {
      kind: 'play',
      title: 'Go higher, go lower',
      body: 'Play the note, then ANY key that is higher or lower than it.',
      names: false,
      keyboard: [60, 76],
      hintAfterMs: 12000,
      targets: higherLowerTargets,
    },
    {
      kind: 'play',
      title: 'Follow the notes up',
      body: 'The lit key is the note on the staff. Watch how the notes climb the page as you climb the keys.',
      show: lit,
      names: false,
      keyboard: [60, 72],
      targets: () => readTune([60, 62, 64, 65, 67], 'Play the lit key'),
    },
    {
      kind: 'play',
      title: 'Up and down',
      show: lit,
      names: false,
      keyboard: [60, 72],
      targets: () => readTune([64, 65, 67, 65, 64, 62, 60], 'Play the lit key'),
    },
  ],
};

// ---------------------------------------------------------------- 2. do re mi

const syllables = (midis: number[]) => () => midis.map(syllableTarget);

export const doReMi: LessonDef = {
  id: 'do-re-mi',
  title: 'Do re mi',
  summary: 'Singable names for the white keys, a friendly bridge to letters and staff notes.',
  goals: [
    'Know do re mi fa sol la si and the letters they stand for',
    'Say the name of each note as you play it',
    'Play a tune from its syllables',
  ],
  steps: [
    {
      kind: 'info',
      title: 'Do re mi fa sol la si',
      body: [
        'Singers name the notes with syllables. They are just other names for the same white keys, and "do" is always C.',
        'Say them out loud as you play: it connects your ears, your voice and your fingers.',
      ],
      list: [
        'do = C   re = D   mi = E   fa = F',
        'sol = G   la = A   si = B   then do again, one octave up',
      ],
      staff: { notes: [60, 62, 64, 65, 67, 69, 71, 72], labels: 'all', solfege: true },
      keyboard: { from: 60, to: 72, names: true },
    },
    {
      kind: 'play',
      title: 'Up: do re mi fa sol',
      body: 'Say each name as you play it.',
      show: { keys: true },
      keyboard: [60, 72],
      targets: syllables([60, 62, 64, 65, 67]),
    },
    {
      kind: 'play',
      title: 'The whole scale, going up',
      show: { keys: true },
      keyboard: [60, 72],
      targets: syllables(C_TO_C),
    },
    {
      kind: 'play',
      title: 'And back down',
      show: { keys: true },
      keyboard: [60, 72],
      targets: syllables([...C_TO_C].reverse()),
    },
    {
      kind: 'play',
      title: 'Which key is it?',
      body: 'A syllable appears: play that key.',
      keyboard: [60, 72],
      hintAfterMs: 12000,
      targets: () => quizTargets(C_TO_G, 6, 'solfege'),
    },
    {
      kind: 'play',
      title: 'Find it without the letters',
      body: 'The letters are gone from the keys. Say the syllable and find it.',
      names: false,
      keyboard: [60, 72],
      hintAfterMs: 12000,
      targets: () => quizTargets(C_TO_C, 8, 'solfege'),
    },
    {
      kind: 'play',
      title: 'A tune in syllables',
      body: 'You know this one. Sing it as you play: do do sol sol la la sol.',
      names: false,
      keyboard: [60, 72],
      hintAfterMs: 12000,
      targets: syllables([60, 60, 67, 67, 69, 69, 67]),
    },
  ],
};

// ---------------------------------------------------------------- 3. three notes

export const threeNotes: LessonDef = {
  id: 'staff-three-notes',
  title: 'Three notes on the staff',
  summary: 'Just C, D and E: where they sit on the staff, with their letters printed underneath at first.',
  goals: [
    'Find middle C, D and E on the staff',
    'Play the note you see, with the letter under it, then without it',
  ],
  steps: [
    {
      kind: 'info',
      title: 'Lines and spaces',
      body: [
        'The staff has five lines, and notes sit ON a line or in a SPACE between two lines. We count lines from the bottom.',
        'Three notes to start with: C sits on its own short line under the staff. D hangs just under the bottom line. E sits on the bottom line.',
        'Each note has its letter (and its syllable) printed under it for now.',
      ],
      staff: { notes: [60, 62, 64], labels: 'all', solfege: true },
      keyboard: { from: 60, to: 67, keys: { 60: { kind: 'current' }, 62: { kind: 'current' }, 64: { kind: 'current' } } },
    },
    {
      kind: 'play',
      title: 'Up the three notes',
      show: { ...lit, labels: 'all', solfege: true },
      keyboard: [60, 67],
      targets: () => [60, 62, 64].map((m) => noteTarget(m)),
    },
    {
      kind: 'play',
      title: 'Up and down',
      show: { ...lit, labels: 'all', solfege: true },
      keyboard: [60, 67],
      targets: () => [60, 62, 64, 62, 60, 62, 64].map((m) => noteTarget(m)),
    },
    {
      kind: 'play',
      title: 'Read the note: letters help you',
      body: 'A note on the staff with its letter below. Play it.',
      names: false,
      keyboard: [60, 67],
      show: { labels: 'all' },
      hintAfterMs: 12000,
      targets: () => quizTargets([60, 62, 64], 5, 'staff'),
    },
    {
      kind: 'play',
      title: 'Read the note: fewer helpers',
      body: 'Only the very first note shows its letter.',
      names: false,
      keyboard: [60, 67],
      show: { labels: 'first' },
      hintAfterMs: 12000,
      targets: () => quizTargets([60, 62, 64], 5, 'staff'),
    },
    {
      kind: 'play',
      title: 'Read the note: on your own',
      body: 'No letters now. Use the line and the space: short line under the staff, just under the bottom line, on the bottom line.',
      names: false,
      keyboard: [60, 67],
      hintAfterMs: 12000,
      targets: () => quizTargets([60, 62, 64], 6, 'staff'),
    },
  ],
};

// ---------------------------------------------------------------- 4. five notes

export const fiveNotes: LessonDef = {
  id: 'staff-five-notes',
  title: 'Five notes: your hand position',
  summary: 'C D E F G, the five notes under your right hand, on the staff.',
  goals: [
    'Find C, D, E, F and G on the staff',
    'Connect each finger of your hand position to a note on the page',
    'Read the five notes with the letters fading away',
  ],
  steps: [
    {
      kind: 'info',
      title: 'The notes of your hand',
      body: [
        'You already know these five keys from your hand position. Here is where each one lives on the staff.',
        'F is the first space, and G is the second line. Notice: lines and spaces take turns, just like the white keys, one after the other.',
      ],
      staff: { notes: [60, 62, 64, 65, 67], labels: 'all', solfege: true },
      keyboard: {
        from: 60,
        to: 67,
        keys: { 60: { kind: 'current', label: 'thumb' }, 62: { kind: 'current', label: 'index' }, 64: { kind: 'current', label: 'middle' }, 65: { kind: 'current', label: 'ring' }, 67: { kind: 'current', label: 'pinky' } },
      },
    },
    {
      kind: 'play',
      title: 'Climb the staff',
      show: { ...lit, labels: 'all', solfege: true },
      keyboard: [60, 67],
      targets: () => C_TO_G.map((m) => noteTarget(m)),
    },
    {
      kind: 'play',
      title: 'Come back down',
      show: { ...lit, labels: 'all' },
      keyboard: [60, 67],
      targets: () => [...C_TO_G].reverse().map((m) => noteTarget(m)),
    },
    {
      kind: 'play',
      title: 'Steps and skips on the staff',
      body: 'Keys not lit now. Each note is a step or a skip from the one before: line to space is a step, line to line is a skip.',
      names: false,
      show: { staff: true, labels: 'all' },
      keyboard: [60, 67],
      hintAfterMs: 12000,
      targets: () => readTune([60, 62, 64, 62, 64, 67, 65, 64, 62, 60]),
    },
    {
      kind: 'play',
      title: 'Read the note: letters help you',
      names: false,
      keyboard: [60, 67],
      show: { labels: 'all' },
      hintAfterMs: 12000,
      targets: () => quizTargets(C_TO_G, 6, 'staff'),
    },
    {
      kind: 'play',
      title: 'Read the note: fewer helpers',
      names: false,
      keyboard: [60, 67],
      show: { labels: 'first' },
      hintAfterMs: 12000,
      targets: () => quizTargets(C_TO_G, 6, 'staff'),
    },
    {
      kind: 'play',
      title: 'Read the note: on your own',
      names: false,
      keyboard: [60, 67],
      hintAfterMs: 12000,
      targets: () => quizTargets(C_TO_G, 8, 'staff'),
    },
    {
      kind: 'play',
      title: 'Mixed: staff and letters',
      body: 'Some prompts are on the staff, some are letters.',
      names: false,
      keyboard: [60, 67],
      hintAfterMs: 12000,
      targets: () => quizTargets(C_TO_G, 8, 'mixed'),
    },
  ],
};

// ---------------------------------------------------------------- 5. short tunes

const MARY = [64, 62, 60, 62, 64, 64, 64];
const BUNS = [64, 62, 60, 64, 62, 60, 60, 60, 60, 60, 62, 62, 62, 62, 64, 62, 60];
const CLAIR = [60, 60, 60, 62, 64, 62, 60, 64, 62, 62, 60];
const ODE = [64, 64, 65, 67, 67, 65, 64, 62, 60, 60, 62, 64, 64, 62, 62];

export const shortTunes: LessonDef = {
  id: 'read-short-tunes',
  title: 'Read short tunes',
  summary: 'Four well-known tunes, read from the sheet. The letters fade from all to none.',
  goals: [
    'Read a whole line of notes from left to right',
    'See the shape of a tune: repeats, steps, skips',
    'Play a tune from sheet music with no letters at all',
  ],
  steps: [
    {
      kind: 'info',
      title: 'Reading a tune',
      body: [
        'Real music is read from left to right, a few notes at a time. Do not name every note: look at the SHAPE. Does it go up, down or stay? A step or a skip?',
        'Each tune below is in your hand position, C to G. The first has its letters under the notes; the last has none.',
      ],
    },
    {
      kind: 'play',
      title: 'Mary had a little lamb',
      body: 'The keys are lit, the letters are on the sheet. Look at the shape: down by steps, up again, then three of the same.',
      show: { ...lit, labels: 'all' },
      keyboard: [60, 67],
      names: false,
      targets: () => readTune(MARY, 'Play the lit key'),
    },
    {
      kind: 'play',
      title: 'Hot cross buns',
      body: 'Letters on the sheet, keys not lit.',
      show: { staff: true, labels: 'all' },
      keyboard: [60, 67],
      names: false,
      hintAfterMs: 12000,
      targets: () => readTune(BUNS),
    },
    {
      kind: 'play',
      title: 'Au clair de la lune',
      body: 'Only the first note has its letter.',
      show: { staff: true, labels: 'first' },
      keyboard: [60, 67],
      names: false,
      hintAfterMs: 12000,
      targets: () => readTune(CLAIR),
    },
    {
      kind: 'play',
      title: 'Ode to Joy, no letters',
      body: 'Just the sheet music. You know this one: look at the shape.',
      show: { staff: true },
      keyboard: [60, 67],
      names: false,
      hintAfterMs: 12000,
      targets: () => readTune(ODE),
    },
  ],
};

// ---------------------------------------------------------------- 6. the notes above

export const reachHigher: LessonDef = {
  id: 'staff-reach-higher',
  title: 'Reaching higher: A, B and the next C',
  summary: 'Three more notes on the staff, up to the C above, to complete the first octave.',
  goals: ['Find A, B and the next C on the staff', 'Read all the notes from one C to the next'],
  steps: [
    {
      kind: 'info',
      title: 'Above the G',
      body: [
        'Keep climbing: A sits in the second space, B on the middle line, and C in the third space.',
        'Together with what you know, that is every white key from one C to the next: do re mi fa sol la si do.',
      ],
      staff: { notes: [69, 71, 72], labels: 'all', solfege: true },
      keyboard: { from: 60, to: 72, keys: { 69: { kind: 'current' }, 71: { kind: 'current' }, 72: { kind: 'current' } } },
    },
    {
      kind: 'play',
      title: 'The whole climb',
      show: { ...lit, labels: 'all', solfege: true },
      keyboard: [60, 72],
      targets: () => C_TO_C.map((m) => noteTarget(m)),
    },
    {
      kind: 'play',
      title: 'The whole way down',
      show: { ...lit, labels: 'all' },
      keyboard: [60, 72],
      targets: () => [...C_TO_C].reverse().map((m) => noteTarget(m)),
    },
    {
      kind: 'play',
      title: 'Read the new notes: letters help you',
      names: false,
      keyboard: [60, 72],
      show: { labels: 'all' },
      hintAfterMs: 12000,
      targets: () => quizTargets(whiteKeys(67, 72), 6, 'staff'),
    },
    {
      kind: 'play',
      title: 'Read the whole octave: fewer helpers',
      names: false,
      keyboard: [60, 72],
      show: { labels: 'first' },
      hintAfterMs: 12000,
      targets: () => quizTargets(C_TO_C, 6, 'staff'),
    },
    {
      kind: 'play',
      title: 'Read the whole octave: on your own',
      names: false,
      keyboard: [60, 72],
      hintAfterMs: 12000,
      targets: () => quizTargets(C_TO_C, 8, 'staff'),
    },
  ],
};

// ---------------------------------------------------------------- 7. landmarks

const LANDMARKS_MIDI = [60, 67, 72];
const onStaff = whiteKeys(60, 77); // middle C up to the top line: no extra ledger lines

/** A landmark and a white key `d` white keys away from it (never off the staff range). */
function landmarkPair(): { from: number; to: number; d: number } {
  for (;;) {
    const from = pick(LANDMARKS_MIDI);
    const d = pick([-3, -2, -1, 1, 2, 3, 4]);
    const to = onStaff[onStaff.indexOf(from) + d];
    if (to !== undefined && onStaff.indexOf(from) + d >= 0) return { from, to, d };
  }
}

const stepOrSkipChoices = (): Choice[] =>
  Array.from({ length: 6 }, () => {
    const { from, to, d } = landmarkPair();
    const size = Math.abs(d);
    return {
      prompt: `The first note is ${midiToName(from)}. How far away is the second note?`,
      notes: [from, to],
      labels: 'first',
      options: ['A step', 'A skip', 'A leap'],
      answer: size === 1 ? 0 : size === 2 ? 1 : 2,
      hint: 'Step: the very next line or space. Skip: the next line or space after that. Leap: more.',
    };
  });

const nameFromLandmarkChoices = (): Choice[] =>
  Array.from({ length: 5 }, () => {
    const { from, to } = landmarkPair();
    const others = whiteKeys(60, 71)
      .filter((m) => m % 12 !== to % 12)
      .sort(() => Math.random() - 0.5)
      .slice(0, 2);
    const options = [to, ...others].map(midiToName).sort(() => Math.random() - 0.5);
    return {
      prompt: `Start from ${midiToName(from)}. What is the second note?`,
      notes: [from, to],
      labels: 'first',
      options,
      answer: options.indexOf(midiToName(to)),
      hint: 'Count the lines and spaces from the first note: that many white keys away.',
    };
  });

export const landmarks: LessonDef = {
  id: 'staff-landmarks',
  title: 'Landmark notes',
  summary: 'Three anchor notes, and a way to read every other note as a step or a skip from one.',
  goals: [
    'Recognise middle C, the G and the high C straight away',
    'Read any other note by its distance from a landmark',
  ],
  steps: [
    {
      kind: 'info',
      title: 'Three landmarks',
      body: [
        'You do not have to name every note from the bottom. Learn three landmarks and read the others as a step or a skip from one of them.',
      ],
      list: [
        'Middle C: the note on its own short line under the staff.',
        'G: the second line from the bottom. The curl of the treble clef circles around it.',
        'High C: the third space, a full octave above middle C.',
      ],
      staff: { notes: [60, 67, 72], labels: 'all', solfege: true },
    },
    {
      kind: 'play',
      title: 'Play the landmarks',
      show: { ...lit, labels: 'all' },
      keyboard: [60, 72],
      targets: () => [60, 67, 72, 67, 60].map((m) => noteTarget(m)),
    },
    {
      kind: 'play',
      title: 'Landmarks without help',
      body: 'Middle C, G or high C. Find them from the staff.',
      names: false,
      keyboard: [60, 72],
      hintAfterMs: 12000,
      targets: () => quizTargets([60, 67, 72], 6, 'staff'),
    },
    {
      kind: 'choose',
      title: 'Step, skip or leap from a landmark?',
      body: 'The first note is a landmark. Look at how far the second note is.',
      choices: stepOrSkipChoices,
    },
    {
      kind: 'choose',
      title: 'Name the note from a landmark',
      body: 'Start from the first note and count lines and spaces.',
      choices: nameFromLandmarkChoices,
    },
    {
      kind: 'play',
      title: 'Read from the landmarks',
      body: 'Every note is one or two away from a landmark. No letters.',
      names: false,
      keyboard: [60, 72],
      hintAfterMs: 12000,
      targets: () => quizTargets(C_TO_C.filter((m) => !LANDMARKS_MIDI.includes(m)), 8, 'staff'),
    },
    {
      kind: 'play',
      title: 'Mixed: staff and letters',
      names: false,
      keyboard: [60, 72],
      hintAfterMs: 12000,
      targets: () => quizTargets(C_TO_C, 8, 'mixed'),
    },
  ],
};

export const readingLessons: LessonDef[] = [higherOrLower, doReMi, threeNotes, fiveNotes, shortTunes, reachHigher, landmarks];
