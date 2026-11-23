import { allKeys, quizTargets, whiteKeys } from '../../guide/targets';
import type { LessonDef } from '../types';

export const readingNotes: LessonDef = {
  id: 'reading-notes',
  title: 'Shortcuts and sharps',
  summary: 'Optional memory tricks for reading any note fast, then the black keys. Do the reading lessons first.',
  goals: [
    'Use "Every Good Boy Does Fine" and "FACE" as shortcuts to find a note',
    'Read notes with sharps (the black keys)',
    'Read a mix of staff notes and letters over two octaves',
  ],
  steps: [
    {
      kind: 'info',
      title: 'Two memory tricks',
      body: [
        'You can already read from C to C by distance from the landmarks. These two sayings are shortcuts for finding any note quickly, and for reaching beyond the notes you know. They are optional: skip them if the landmarks work for you.',
      ],
      list: [
        'Middle C sits on its own little line BELOW the staff.',
        'The lines, from the bottom: E G B D F ("Every Good Boy Does Fine").',
        'The spaces, from the bottom: F A C E.',
      ],
    },
    {
      kind: 'play',
      title: 'Read the note',
      body: 'A note appears on the staff: play that key.',
      names: false,
      keyboard: [60, 72],
      hintAfterMs: 12000,
      targets: () => quizTargets(whiteKeys(60, 67), 5, 'staff'),
    },
    {
      kind: 'play',
      title: 'A little higher',
      names: false,
      keyboard: [60, 84],
      hintAfterMs: 12000,
      targets: () => quizTargets(whiteKeys(60, 77), 6, 'staff'),
    },
    {
      kind: 'info',
      title: 'Sharps',
      body: ['A # in front of a note means "the black key just to the right of that note".'],
    },
    {
      kind: 'play',
      title: 'With sharps',
      names: false,
      keyboard: [60, 72],
      hintAfterMs: 12000,
      targets: () => quizTargets(allKeys(60, 72), 6, 'staff'),
    },
    {
      kind: 'play',
      title: 'Mixed: staff and letters',
      body: 'Some prompts are on the staff, some are letters.',
      names: false,
      keyboard: [60, 84],
      hintAfterMs: 12000,
      targets: () => quizTargets(whiteKeys(60, 79), 8, 'mixed'),
    },
  ],
};
