import type { ClassDef } from './types';
import { KeyboardBasics } from './keyboard-basics/KeyboardBasics';
import { RhythmBasics } from './rhythm-basics/RhythmBasics';
import { ReadingNotes } from './reading-notes/ReadingNotes';
import { FirstSongs } from './first-songs/FirstSongs';

/** Order here = order in the dropdown = suggested learning order. */
export const classes: ClassDef[] = [
  {
    id: 'keyboard-basics',
    title: 'Meet the keyboard',
    summary: 'Black-key groups, middle C, and where each note name lives. Click keys to hear them.',
    Component: KeyboardBasics,
  },
  {
    id: 'rhythm-basics',
    title: 'Feel the beat',
    summary: 'Count out loud with the metronome and see how note lengths look on paper.',
    Component: RhythmBasics,
  },
  {
    id: 'reading-notes',
    title: 'Reading notes',
    summary: 'A note appears on the staff: click the matching key. Builds sight-reading.',
    Component: ReadingNotes,
  },
  {
    id: 'first-songs',
    title: 'First songs',
    summary: 'Right hand, five fingers, one position. Step through or play along.',
    Component: FirstSongs,
  },
];
