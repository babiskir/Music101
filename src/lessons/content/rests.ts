import type { LessonDef } from '../types';
import { rhythmStep, type RhythmOptions } from './builders';

const hear = 'You will hear the pattern first: the rests are silent. Then, after the count-in, play it yourself.';
const how = 'After a count-in, play any key on every note. On a rest, lift your hand and keep counting.';

const rhythm = (title: string, beats: number[], o: RhythmOptions = {}) => rhythmStep(title, beats, { body: how, ...o });

export const rests: LessonDef = {
  id: 'rests',
  title: 'Rests: counting the silence',
  summary: 'Music is made of sound and silence. Learn the rests, and keep counting while you wait.',
  goals: [
    'Recognise the quarter, half and whole rest on the staff',
    'Stay silent for exactly the length of a rest',
    'Start playing after a rest, right on time',
  ],
  steps: [
    {
      kind: 'info',
      title: 'A rest is a beat of silence',
      body: [
        'Every note has a matching rest: a sign that says "do not play, but keep counting". Rests have lengths, just like notes.',
        'The beat does not stop during a rest. Count out loud through it, and lift your hand off the key.',
      ],
      list: [
        'Quarter rest: a zig-zag. One beat of silence.',
        'Half rest: a small block sitting ON the middle line, like a hat. Two beats.',
        'Whole rest: a small block hanging UNDER a line, like a hole. A whole bar of silence.',
        'Eighth rest: looks like a tiny 7. Half a beat.',
      ],
    },
    rhythm('One quarter rest', [1, 1, 1, -1, 1, 1, 1, -1], { listen: true, body: hear }),
    rhythm('Rests in the middle', [1, -1, 1, -1, 1, 1, 2], { listen: true, body: hear }),
    rhythm('Half rests', [1, 1, -2, 2, -2, 1, 1, 1, -1], { listen: true, body: hear }),
    rhythm('A whole bar of silence', [1, 1, 1, 1, -4, 2, 2], { listen: true, body: hear }),
    {
      kind: 'info',
      title: 'Starting after a rest',
      body: [
        'Sometimes a bar begins with a rest. The count-in ends, and the first beat is silent: count ONE in your head, then play on TWO.',
        'This is the hardest part of rests. Go slowly, and say the counts out loud.',
      ],
    },
    rhythm('Start on beat two', [-1, 1, 1, 1, -1, 1, 2], { listen: true, bpm: 54, body: hear }),
    rhythm('Silence, then a long note', [-2, 1, 1, -1, 1, 2], { listen: true, bpm: 54, body: hear }),
    rhythm('Waltz with rests', [2, -1, 1, 1, -1, 3], { beatsPerBar: 3, listen: true, body: 'Three beats in a bar. You will hear it first.' }),
    rhythm('Eighth notes and rests', [1, 0.5, 0.5, -1, 1, 2, -2, 1.5, 0.5, -2], { listen: true, bpm: 54, body: hear }),
    rhythm('Notes and rests, on your own', [1, -1, 0.5, 0.5, 1, -2, 2, -1, 1, 1, 1]),
  ],
};
