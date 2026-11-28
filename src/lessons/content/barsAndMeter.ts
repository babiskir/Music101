import type { LessonDef } from '../types';
import { rhythmStep, type RhythmOptions } from './builders';

const how = 'After a count-in, play any key on every note that lights up. Keep it steady.';
const waltz = 'Three beats in every bar. Press a little harder on the first beat of each bar: ONE two three.';
const hear = 'You will hear the pattern first. Then, after the count-in, play it yourself: one key for every note.';

const rhythm = (title: string, beats: number[], o: RhythmOptions = {}) => rhythmStep(title, beats, { body: how, ...o });

export const barsAndMeter: LessonDef = {
  id: 'bars-and-meter',
  title: 'Bars and time signatures',
  summary: 'Beats group into bars. Feel four beats and three, then build up the dotted note one small step at a time.',
  goals: [
    'Explain what a bar (measure) and a time signature are',
    'Feel the strong first beat in 4/4 and in 3/4 (waltz time)',
    'Play eighth notes, then a dotted half note, then a dotted quarter note',
  ],
  steps: [
    {
      kind: 'info',
      title: 'Beats live in bars',
      body: [
        'On sheet music, the beats are grouped into bars (also called measures), separated by vertical lines.',
        'The two numbers at the start, the time signature, tell you how many beats are in a bar. The top number is the count; the bottom 4 means "a quarter note is one beat".',
      ],
      list: [
        '4/4 ("four-four"): four beats per bar. Count ONE two three four. Most pop songs.',
        '3/4 ("three-four"): three beats per bar. Count ONE two three. The waltz.',
        'The first beat of a bar is the strongest. The dots on the screen show where you are in the bar.',
      ],
    },
    rhythm('Four beats in a bar', [1, 1, 1, 1, 2, 2, 4]),
    rhythm('Long and short in four', [2, 1, 1, 1, 1, 2, 0.5, 0.5, 1, 2]),
    {
      kind: 'info',
      title: 'Waltz time',
      body: ['Now three beats per bar. The count-in has three clicks, then you play.'],
      list: ['A whole note does not fit in a bar of three: the longest note is the dotted half note, 3 beats.'],
    },
    rhythm('Waltz: three steady beats', [1, 1, 1, 1, 1, 1, 1, 1, 1], { beatsPerBar: 3, body: waltz }),
    rhythm('Waltz: long and short', [2, 1, 1, 2, 3, 1, 1, 1], { beatsPerBar: 3, body: waltz }),

    // ---- the dotted note, built up slowly: dotted half -> the "and" -> dotted quarter
    {
      kind: 'info',
      title: 'A dot makes a note longer',
      body: [
        'A dot after a note makes it half as long again. We will meet two dotted notes, one at a time. The first is easy.',
      ],
      list: [
        'Dotted half note: 2 beats + 1 beat = 3 beats. Hold the key through ONE two three.',
        'In a bar of four, a dotted half note is followed by one single beat.',
      ],
    },
    rhythm('Dotted half note, then one beat', [3, 1, 3, 1], { listen: true, body: hear }),
    {
      kind: 'info',
      title: 'The "and" between the beats',
      body: [
        'Between the beats there is a half-way point. We call it "and": ONE and TWO and THREE and FOUR and.',
        'An eighth note lasts from one count to the next: a single "and" is half a beat. Two eighths fit in one beat.',
      ],
    },
    rhythm('A beat split in two', [1, 0.5, 0.5, 1, 1, 1, 1, 0.5, 0.5, 1], { listen: true, bpm: 54, body: hear }),
    {
      kind: 'info',
      title: 'The dotted quarter note',
      body: [
        'A dotted quarter note lasts one and a half beats: a beat plus an "and". After it comes a short eighth note (one "and") that completes the two beats.',
        'Count it ONE and TWO and. You play on ONE, hold the key down through "and" and TWO, then play again on the last "and".',
        'Then the next note comes right on THREE. Do not rush it.',
      ],
      list: [
        'Tap on ONE.',
        'Keep the key down through "and" and TWO.',
        'Tap again on the "and" after TWO. This is the short note.',
        'Tap on THREE, exactly with the click.',
      ],
    },
    rhythm('Dotted quarter: just one bar', [1.5, 0.5, 2], { listen: true, bpm: 44, body: hear }),
    rhythm('Dotted quarter: twice', [1.5, 0.5, 2, 1.5, 0.5, 2], { listen: true, bpm: 44, body: hear }),
    rhythm('Dotted quarter and two quarters', [1.5, 0.5, 1, 1, 1.5, 0.5, 1, 1], { listen: true, bpm: 50, body: hear }),
    rhythm('Like the end of Ode to Joy', [1, 1, 1, 1, 1.5, 0.5, 2], { listen: true, bpm: 56, body: hear }),
    rhythm('Dotted quarter and eighth', [1.5, 0.5, 1, 1, 1.5, 0.5, 2]),
    {
      kind: 'info',
      title: 'Dotted half in waltz time',
      body: ['Back to the dotted half note. In 3/4 it fills a whole bar by itself: hold ONE two three.'],
    },
    rhythm('Dotted half in waltz time', [3, 1, 1, 1, 3], { beatsPerBar: 3, listen: true, body: waltz }),
    rhythm('Waltz with a dotted quarter', [3, 1.5, 0.5, 1, 3], { beatsPerBar: 3, listen: true, bpm: 54, body: waltz }),
    rhythm('Everything together', [1.5, 0.5, 2, 2, 0.5, 0.5, 1, 4]),
  ],
};
