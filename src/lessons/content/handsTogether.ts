import { bothNames, pitchToMidi, spokenBoth } from '../../domain/notes';
import { withTiming, type Song } from '../../domain/song';
import { maryHadALittleLamb } from '../../data/songs/maryHadALittleLamb';
import { odeToJoy } from '../../data/songs/odeToJoy';
import type { KeyHighlight } from '../../features/keyboard/Keyboard';
import type { Target } from '../../guide/types';
import type { LessonDef } from '../types';
import { noteTarget } from './builders';

/**
 * Both hands at the same moment. Starts with one key per hand (thumbs, pinkies), then both hands moving
 * together, then a right-hand tune over one left-hand note at the start of every bar.
 * Over USB the two keys must land together; with the microphone they may come one after the other.
 */

/** One key for each hand, pressed together. The right hand's note is the melody. */
export function together(left: number, right: number, beats = 1): Target {
  return {
    keys: [left, right],
    ref: right,
    beats,
    label: `${bothNames(left)} + ${bothNames(right)}`,
    chip: `${bothNames(left)} + ${bothNames(right)}`,
    hint: `Left hand on ${bothNames(left)}, right hand on ${bothNames(right)}. Press them at the same moment.`,
    spoken: `Both hands: ${spokenBoth(left % 12)}, and ${spokenBoth(right % 12)}`,
  };
}

/**
 * The song's right-hand tune, with the left hand adding one low note on the first beat of every bar
 * (\`bass[bar]\`). Everything else is the right hand alone.
 */
export function withBass(song: Song, bass: number[]): Target[] {
  return withTiming(song).map((n) => {
    const melody = pitchToMidi(n.pitch);
    const bar = Math.floor(n.startBeat / song.beatsPerBar);
    const onTheOne = n.startBeat % song.beatsPerBar === 0;
    return onTheOne ? together(bass[bar], melody, n.beats) : { ...noteTarget(melody), beats: n.beats };
  });
}

const DO = 48; // left pinky
const SOL = 55; // left thumb
const MARY_BASS = [DO, DO, SOL, DO, DO, DO, SOL, DO];
const ODE_BASS = [DO, SOL, DO, SOL, DO, SOL, DO, SOL];

const grandLit = { keys: true, staff: true, clef: 'grand' } as const;
const grandOnly = { staff: true, clef: 'grand' } as const;

const handsPicture: Record<number, KeyHighlight> = {
  48: { kind: 'next', label: 'pinky' }, 50: { kind: 'next', label: 'ring' }, 52: { kind: 'next', label: 'middle' }, 53: { kind: 'next', label: 'index' }, 55: { kind: 'next', label: 'thumb' },
  60: { kind: 'current', label: 'thumb' }, 62: { kind: 'current', label: 'index' }, 64: { kind: 'current', label: 'middle' }, 65: { kind: 'current', label: 'ring' }, 67: { kind: 'current', label: 'pinky' },
};

const repeat = (n: number, t: () => Target) => Array.from({ length: n }, t);

export const handsTogether: LessonDef = {
  id: 'hands-together',
  title: 'Hands together',
  summary: 'Both hands at the same moment: first one key each, then moving together, then a tune over a bass note.',
  goals: [
    'Press one key with each hand at exactly the same moment',
    'Move both hands together, in the same and in opposite directions',
    'Play a right-hand tune with a left-hand note at the start of each bar',
  ],
  steps: [
    {
      kind: 'info',
      title: 'Both hands at once',
      body: [
        'Until now the hands took turns. Now they play together: two keys pressed at exactly the same moment, so they sound like one.',
        'Both hands in position: left pinky on the Do (C) below middle Do, right thumb on middle Do. On the grand staff, two notes that are played together sit one above the other.',
        'Connected over USB, the app hears both keys at once. With the microphone it can only hear one note at a time, so there you play the two keys one after the other.',
      ],
      staff: { notes: [55, 60], labels: 'all', clef: 'grand' },
      keyboard: { from: 48, to: 72, keys: handsPicture },
    },
    {
      kind: 'play',
      title: 'Thumbs together',
      body: 'Left thumb on Sol (G), right thumb on Do (C). Press both, let go, again.',
      show: { ...grandLit, labels: 'first' },
      keyboard: [48, 72],
      targets: () => repeat(4, () => together(55, 60)),
    },
    {
      kind: 'play',
      title: 'Pinkies together',
      body: 'Now the outside fingers: left pinky on Do (C), right pinky on Sol (G).',
      show: { ...grandLit, labels: 'first' },
      keyboard: [48, 72],
      targets: () => repeat(4, () => together(48, 67)),
    },
    {
      kind: 'play',
      title: 'The same note in both hands',
      body: 'Both hands play the same note, one octave apart, and climb together. The left hand goes pinky to thumb, the right hand thumb to pinky.',
      show: { ...grandLit, labels: 'all' },
      keyboard: [48, 72],
      targets: () => [0, 2, 4, 5, 7, 5, 4, 2, 0].map((d) => together(48 + d, 60 + d)),
    },
    {
      kind: 'play',
      title: 'Mirror: thumbs out to pinkies',
      body: 'The hands move apart, like a mirror: the same finger in both hands every time.',
      show: { ...grandLit, labels: 'first' },
      keyboard: [48, 72],
      targets: () => [[55, 60], [53, 62], [52, 64], [50, 65], [48, 67], [50, 65], [52, 64], [53, 62], [55, 60]].map(([l, r]) => together(l, r)),
    },
    {
      kind: 'play',
      title: 'Same note, from the sheet',
      body: 'Keys not lit. Read both staves: the two notes of each pair are played together.',
      show: grandOnly,
      keyboard: [48, 72],
      names: false,
      hintAfterMs: 12000,
      targets: () => [0, 4, 2, 5, 4, 7, 0].map((d) => together(48 + d, 60 + d)),
    },
    {
      kind: 'info',
      title: 'A tune over a bass note',
      body: [
        'Most piano music works like this: the right hand plays the tune, and the left hand plays a low note under it, often on the first beat of every bar.',
        'Your left hand only needs two keys here: Do (C) with the pinky and Sol (G) with the thumb. Play the left-hand note together with the first note of each bar, then let the right hand carry on alone.',
      ],
    },
    {
      kind: 'play',
      title: 'Mary, with a bass: lit',
      body: 'The lit keys show both hands. Two lit keys: press them together.',
      show: { ...grandLit, labels: 'first' },
      keyboard: [48, 72],
      beatsPerBar: maryHadALittleLamb.beatsPerBar,
      targets: () => withBass(maryHadALittleLamb, MARY_BASS),
    },
    {
      kind: 'play',
      title: 'Mary, with a bass: from the sheet',
      body: 'Keys not lit. At the start of every bar, a note on each staff: both hands together.',
      show: grandOnly,
      keyboard: [48, 72],
      names: false,
      hintAfterMs: 12000,
      beatsPerBar: maryHadALittleLamb.beatsPerBar,
      targets: () => withBass(maryHadALittleLamb, MARY_BASS),
    },
    {
      kind: 'play',
      title: 'Ode to Joy, with a bass: lit',
      show: { ...grandLit, labels: 'first' },
      keyboard: [48, 72],
      beatsPerBar: odeToJoy.beatsPerBar,
      targets: () => withBass(odeToJoy, ODE_BASS),
    },
    {
      kind: 'play',
      title: 'Ode to Joy, with a bass: from the sheet',
      body: 'Your first piece for both hands, read from the grand staff.',
      show: grandOnly,
      keyboard: [48, 72],
      names: false,
      hintAfterMs: 12000,
      beatsPerBar: odeToJoy.beatsPerBar,
      targets: () => withBass(odeToJoy, ODE_BASS),
    },
  ],
};
