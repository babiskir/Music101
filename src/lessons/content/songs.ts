import { midiToName, pitchToMidi } from '../../domain/notes';
import { fingerPhrase } from '../../guide/targets';
import { withTiming, type Song, type TimedNote } from '../../domain/song';
import type { Step, Target } from '../../guide/types';
import { jingleBells } from '../../data/songs/jingleBells';
import { maryHadALittleLamb } from '../../data/songs/maryHadALittleLamb';
import { odeToJoy } from '../../data/songs/odeToJoy';
import { twinkleTwinkle } from '../../data/songs/twinkleTwinkle';
import type { LessonDef } from '../types';

function toTarget(n: TimedNote): Target {
  const midi = pitchToMidi(n.pitch);
  return {
    midi,
    ref: midi,
    finger: n.finger,
    beats: n.beats,
    label: n.finger ? `${midiToName(midi)} · ${fingerPhrase(n.finger)}` : midiToName(midi),
    chip: midiToName(midi),
  };
}

/** Notes of bars [fromBar, toBar] (1-based, inclusive). */
function barsOf(notes: TimedNote[], beatsPerBar: number, fromBar: number, toBar: number): TimedNote[] {
  return notes.filter((n) => {
    const bar = Math.floor(n.startBeat / beatsPerBar) + 1;
    return bar >= fromBar && bar <= toBar;
  });
}

/**
 * Learn a song in pieces: two bars at a time with everything lit up, then four bars with only the
 * sheet music and finger numbers, then the whole song from the sheet.
 */
const WORDS = ['one', 'two', 'three', 'four', 'five', 'six'];

export function songLesson(song: Song, summary: string): LessonDef {
  const notes = withTiming(song);
  const bars = Math.ceil((notes[notes.length - 1].startBeat + notes[notes.length - 1].beats) / song.beatsPerBar);

  const piece = (from: number, to: number, helped: boolean, title: string): Step => {
    const chunk = barsOf(notes, song.beatsPerBar, from, to).map((n) => toTarget(n));
    return {
      kind: 'play',
      title,
      body: helped
        ? 'The key to play is lit, with the finger number.'
        : 'Read the notes from the sheet. The keys are not lit; there is a hint if you get stuck.',
      show: { keys: helped, fingers: true, staff: true },
      beatsPerBar: song.beatsPerBar,
      hintAfterMs: 10000,
      targets: chunk,
    };
  };

  const steps: Step[] = [
    {
      kind: 'info',
      title: `Get ready: ${song.title}`,
      body: [song.handPosition, 'Learn it a few bars at a time. Slow and correct beats fast and wrong.'],
    },
  ];

  // Pieces are named in words ("Phrase two, second half"), never with numerals.
  for (let b = 1, phrase = 0; b <= bars; b += 4, phrase++) {
    const name = `Phrase ${WORDS[phrase] ?? 'next'}`;
    const firstEnd = Math.min(b + 1, bars);
    steps.push(piece(b, firstEnd, true, firstEnd < bars ? `${name}, first half` : name));
    if (firstEnd < bars) {
      const secondEnd = Math.min(b + 3, bars);
      steps.push(piece(firstEnd + 1, secondEnd, true, `${name}, second half`));
      steps.push(piece(b, secondEnd, false, `${name}, all together`));
    }
  }
  if (bars > 4) steps.push({ ...piece(1, bars, false, `The whole song: ${song.title}`) });

  return {
    id: song.id,
    title: song.title,
    summary,
    goals: [
      'Play the whole melody with one hand position',
      'Follow the sheet music and the finger numbers',
      'Play from the sheet without the keys lit up',
    ],
    steps,
  };
}

export const maryLesson = songLesson(
  maryHadALittleLamb,
  'A tune that mostly moves by steps, with long and short notes. A gentle start before Ode to Joy.',
);
export const jingleBellsLesson = songLesson(
  jingleBells,
  'The chorus everyone knows, with a dotted note and a big leap at the end.',
);
export const odeToJoyLesson = songLesson(odeToJoy, 'Your first song: Beethoven, right hand, five fingers, no hand movement.');
export const twinkleLesson = songLesson(
  twinkleTwinkle,
  'A familiar melody, with one new note: the pinky stretches one key past G.',
);
