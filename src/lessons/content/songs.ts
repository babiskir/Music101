import { midiToName, pitchToMidi } from '../../domain/notes';
import { withTiming, type Song, type TimedNote } from '../../domain/song';
import type { Step, Target } from '../../guide/types';
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
    label: n.finger ? `${midiToName(midi)} · finger ${n.finger}` : midiToName(midi),
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
export function songLesson(song: Song, summary: string): LessonDef {
  const notes = withTiming(song);
  const bars = Math.ceil((notes[notes.length - 1].startBeat + notes[notes.length - 1].beats) / song.beatsPerBar);

  const piece = (from: number, to: number, helped: boolean): Step => {
    const chunk = barsOf(notes, song.beatsPerBar, from, to).map((n) => toTarget(n));
    return {
      kind: 'play',
      title: from === to ? `Bar ${from}` : `Bars ${from}–${to}`,
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
      body: [song.handPosition, ...song.tips.slice(0, 2)],
    },
  ];

  for (let b = 1; b <= bars; b += 4) {
    const firstEnd = Math.min(b + 1, bars);
    steps.push(piece(b, firstEnd, true));
    if (firstEnd < bars) {
      const secondEnd = Math.min(b + 3, bars);
      steps.push(piece(firstEnd + 1, secondEnd, true));
      steps.push(piece(b, secondEnd, false));
    }
  }
  if (bars > 4) steps.push({ ...piece(1, bars, false), title: `The whole song: ${song.title}` });

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

export const odeToJoyLesson = songLesson(odeToJoy, 'Your first song: Beethoven, right hand, five fingers, no hand movement.');
export const twinkleLesson = songLesson(
  twinkleTwinkle,
  'A familiar melody, with one new note: the pinky stretches one key past G.',
);
