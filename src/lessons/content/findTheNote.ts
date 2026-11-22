import { LANDMARKS } from '../../guide/landmarks';
import { allKeys, quizTargets, whiteKeys } from '../../guide/targets';
import type { LessonDef } from '../types';

export const findTheNote: LessonDef = {
  id: 'find-the-key',
  title: 'Find the note',
  summary: 'A note appears as a letter or on the staff. Play it on your piano.',
  goals: [
    'Go from a letter (A to G, with sharps like F#) to the right key without counting',
    'Do the same with a note written on the staff',
    'Use the landmark trick for each note name',
  ],
  steps: [
    {
      kind: 'info',
      title: 'The landmark tricks',
      body: ['Use the black keys as landmarks. In every octave:'],
      list: [0, 2, 4, 5, 7, 9, 11].map((pc) => LANDMARKS[pc]),
    },
    {
      kind: 'play',
      title: 'Find the letter',
      body: 'A letter appears: play that note. Any octave counts.',
      names: false,
      keyboard: [60, 72],
      targets: () => quizTargets(whiteKeys(60, 72), 6, 'name'),
    },
    {
      kind: 'play',
      title: 'Sharps and flats too',
      body: 'F# and Gb are the same key.',
      names: false,
      keyboard: [60, 72],
      targets: () => quizTargets(allKeys(60, 72), 6, 'name'),
    },
    {
      kind: 'play',
      title: 'Letters on the whole keyboard',
      names: false,
      keyboard: [36, 96],
      hintAfterMs: 12000,
      targets: () => quizTargets(whiteKeys(36, 96), 6, 'name'),
    },
    {
      kind: 'play',
      title: 'Mixed: letters and sheet music',
      body: 'Some prompts are letters, some are notes on the staff. For a staff note, play exactly that key.',
      names: false,
      keyboard: [60, 84],
      targets: () => quizTargets(whiteKeys(60, 79), 8, 'mixed'),
    },
  ],
};
