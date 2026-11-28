import { lessons } from './registry';
import type { LessonDef } from './types';

/**
 * A class is a group of lessons on one theme. The lessons stay as they are; the class gives them a
 * heading in the menu and a pool of exercises for its practice runs (see src/run).
 * Every lesson belongs to exactly one class, and the classes follow the order of the registry.
 */
export interface ClassDef {
  id: string;
  title: string;
  /** One line for the menu and the runs page. */
  summary: string;
  lessonIds: string[];
}

export const classes: ClassDef[] = [
  {
    id: 'keyboard',
    title: 'The keyboard',
    summary: 'Find your way around the keys and use your fingers.',
    lessonIds: ['keyboard-basics', 'find-the-key', 'hand-position'],
  },
  {
    id: 'rhythm',
    title: 'Rhythm',
    summary: 'Steady beats, bars, dotted notes and rests.',
    lessonIds: ['rhythm-basics', 'bars-and-meter', 'rests'],
  },
  {
    id: 'first-reading',
    title: 'First reading',
    summary: 'From higher and lower to reading five notes on the staff.',
    lessonIds: ['steps-and-skips', 'higher-or-lower', 'do-re-mi', 'staff-three-notes', 'staff-five-notes', 'read-short-tunes'],
  },
  {
    id: 'first-songs',
    title: 'First songs',
    summary: 'Whole songs from the sheet, and reaching higher.',
    lessonIds: ['mary-had-a-little-lamb', 'ode-to-joy', 'staff-reach-higher', 'twinkle-twinkle', 'jingle-bells'],
  },
  {
    id: 'reading-more',
    title: 'Reading more',
    summary: 'Landmark notes, new hand positions and your first chords.',
    lessonIds: ['staff-landmarks', 'reading-notes', 'new-positions', 'chords'],
  },
  {
    id: 'left-hand',
    title: 'The left hand',
    summary: 'The bass clef, the grand staff and both hands together.',
    lessonIds: ['bass-clef', 'left-hand-tunes', 'grand-staff', 'hands-together'],
  },
];

export function lessonsOf(c: ClassDef): LessonDef[] {
  return c.lessonIds.map((id) => {
    const l = lessons.find((x) => x.id === id);
    if (!l) throw new Error(`Class ${c.id}: unknown lesson ${id}`);
    return l;
  });
}

export function classOf(lessonId: string): ClassDef | undefined {
  return classes.find((c) => c.lessonIds.includes(lessonId));
}
