import type { LessonDef } from './types';
import { feelTheBeat } from './content/rhythm';
import { findTheNote } from './content/findTheNote';
import { handAndFingers } from './content/handAndFingers';
import { keyboardBasics } from './content/keyboardBasics';
import { odeToJoyLesson, twinkleLesson } from './content/songs';
import { readingNotes } from './content/readingNotes';

/** Order here = order in the Lessons menu = suggested learning order. */
export const lessons: LessonDef[] = [
  keyboardBasics,
  findTheNote,
  handAndFingers,
  feelTheBeat,
  readingNotes,
  odeToJoyLesson,
  twinkleLesson,
];
