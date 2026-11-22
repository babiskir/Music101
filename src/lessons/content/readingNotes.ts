import { allKeys, quizTargets, whiteKeys } from '../../guide/targets';
import type { LessonDef } from '../types';

export const readingNotes: LessonDef = {
  id: 'reading-notes',
  title: 'Reading notes',
  summary: 'Notes appear on the staff, like on real sheet music. Play them on your piano.',
  goals: [
    'Read notes on the treble staff, from middle C upwards',
    'Connect a note on paper to a key on your piano',
    'Use "Every Good Boy Does Fine" and "FACE" to read quickly',
  ],
  steps: [
    {
      kind: 'info',
      title: 'How to read the staff',
      body: ['Higher on the staff means higher on the keyboard. Notes sit on lines or in spaces.'],
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
