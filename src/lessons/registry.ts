import type { LessonDef } from './types';
import { feelTheBeat } from './content/rhythm';
import { findTheNote } from './content/findTheNote';
import { handAndFingers } from './content/handAndFingers';
import { keyboardBasics } from './content/keyboardBasics';
import { barsAndMeter } from './content/barsAndMeter';
import { chords } from './content/chords';
import { newPositions } from './content/newPositions';
import { doReMi, fiveNotes, higherOrLower, landmarks, reachHigher, shortTunes, threeNotes } from './content/reading';
import { jingleBellsLesson, maryLesson, odeToJoyLesson, twinkleLesson } from './content/songs';
import { readingNotes } from './content/readingNotes';
import { stepsAndSkips } from './content/stepsAndSkips';

/**
 * Order here = order in the Lessons menu = suggested learning order.
 * Reading music is a ramp: higher/lower, do re mi, 3 notes, 5 notes, tunes, then songs, then more notes.
 */
export const lessons: LessonDef[] = [
  keyboardBasics,
  findTheNote,
  handAndFingers,
  feelTheBeat,
  barsAndMeter,
  stepsAndSkips,
  higherOrLower,
  doReMi,
  threeNotes,
  fiveNotes,
  shortTunes,
  maryLesson,
  odeToJoyLesson,
  reachHigher,
  twinkleLesson,
  jingleBellsLesson,
  landmarks,
  readingNotes,
  newPositions,
  chords,
];
