import type { LessonDef } from '../types';
import { rhythmStep } from './builders';

const how = 'After a count-in, play any key on every note that lights up. Keep it steady.';

const rhythm = (title: string, beats: number[]) => rhythmStep(title, beats, { body: how });

export const feelTheBeat: LessonDef = {
  id: 'rhythm-basics',
  title: 'Feel the beat',
  summary: 'Play in time with the metronome. The app grades how steady you are.',
  goals: [
    'Count steady beats: 1 2 3 4',
    'Tell whole, half, quarter and eighth notes apart on paper',
    'Play along with a metronome and stay in time',
  ],
  steps: [
    {
      kind: 'info',
      title: 'Count out loud',
      body: ['Music is built on a steady beat, counted 1 2 3 4. The metronome clicks it for you.'],
      list: [
        'A quarter note lasts 1 beat: it gets one count.',
        'A half note lasts 2 beats, a whole note 4 beats.',
        'Eighth notes are twice as fast: "1 and 2 and…".',
        'You can use any key for these exercises; the app only listens to WHEN you play.',
      ],
    },
    rhythm('Steady quarter notes', [1, 1, 1, 1, 1, 1, 1, 1]),
    rhythm('Half notes', [2, 2, 2, 2]),
    rhythm('Mix of long and short', [1, 1, 2, 2, 1, 1]),
    rhythm('Whole notes', [4, 4]),
    rhythm('Eighth notes', [0.5, 0.5, 0.5, 0.5, 1, 1, 1, 1, 2]),
  ],
};
