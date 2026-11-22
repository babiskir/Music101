import type { LessonDef } from './types';
import { KeyboardBasics } from './keyboard-basics/KeyboardBasics';
import { FindTheKey } from './find-the-key/FindTheKey';
import { HandPosition } from './hand-position/HandPosition';
import { RhythmBasics } from './rhythm-basics/RhythmBasics';
import { ReadingNotes } from './reading-notes/ReadingNotes';
import { FirstSongs } from './first-songs/FirstSongs';

/** Order here = order in the dropdown = suggested learning order. */
export const lessons: LessonDef[] = [
  {
    id: 'keyboard-basics',
    title: 'Meet the keyboard',
    summary: 'Black-key groups, middle C, and where each note name lives. Click keys to hear them, or play them on your keyboard and watch them light up.',
    goals: [
      'Spot groups of 2 and 3 black keys instantly',
      'Find any C, and middle C, on the keyboard',
      'Use the groups as landmarks to find every white key',
    ],
    Component: KeyboardBasics,
  },
  {
    id: 'find-the-key',
    title: 'Find the key',
    summary: 'Given a note name, find its key, and the other way round. Answer by clicking, or by pressing the key on your connected keyboard.',
    goals: [
      'Go from a note name (like F4) to the right key without counting',
      'Go from a highlighted key to its name',
      'Know the landmark trick for each of the 7 note names',
    ],
    Component: FindTheKey,
  },
  {
    id: 'hand-position',
    title: 'Hand & fingers',
    summary: 'Where to put each finger, which finger plays which key, and a few finger drills. Play the drills on your real keyboard.',
    goals: [
      'Place your right (and left) hand in five-finger position',
      'Know the finger numbers: 1 = thumb … 5 = pinky',
      'Match any key in the position to its finger, instantly',
      'Keep a relaxed, curved hand shape',
    ],
    Component: HandPosition,
  },
  {
    id: 'rhythm-basics',
    title: 'Feel the beat',
    summary: 'Count out loud with the metronome and see how note lengths look on paper.',
    goals: [
      'Count steady beats: 1 2 3 4',
      'Tell whole, half, quarter and eighth notes apart on paper',
      'Play along with a metronome and stay in time',
    ],
    Component: RhythmBasics,
  },
  {
    id: 'reading-notes',
    title: 'Reading notes',
    summary: 'A note appears on the staff: press the matching key on your keyboard (or click it). Builds sight-reading.',
    goals: [
      'Read notes on the treble staff, from middle C up',
      'Connect a note on paper to a key on the keyboard',
      'Use "Every Good Boy Does Fine" and "FACE" to read quickly',
    ],
    Component: ReadingNotes,
  },
  {
    id: 'first-songs',
    title: 'First songs',
    summary: 'Right hand, five fingers, one position. With a connected keyboard the song waits for you and counts your slips; or play along with the metronome.',
    goals: [
      'Play a whole melody with one hand position',
      'Follow sheet music, fingering and the metronome together',
      'Speed up gradually from 50 BPM',
    ],
    Component: FirstSongs,
  },
];
