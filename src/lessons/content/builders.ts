import { bothNames, spokenBoth } from '../../domain/notes';
import { LANDMARKS } from '../../guide/landmarks';
import type { Finger } from '../../domain/song';
import { fingerPhrase } from '../../guide/targets';
import type { RhythmStep, Target } from '../../guide/types';

/** One exact key to play, optionally with a finger (named in words) and a length for the sheet music. */
export function noteTarget(midi: number, opts: { finger?: Finger; note?: string; hint?: string } = {}): Target {
  const { finger, note, hint } = opts;
  const name = bothNames(midi);
  const parts = [name, finger ? fingerPhrase(finger) : '', note ?? ''].filter(Boolean);
  return {
    midi,
    ref: midi,
    finger,
    beats: 1,
    label: parts.join(' · '),
    chip: name,
    hint,
    spoken: `Play ${spokenBoth(midi % 12)}`,
  };
}

/**
 * A note to read from the sheet music: the prompt does NOT give away the name (no chip either).
 * The hint (after a pause) does.
 */
export function readTarget(midi: number, label = 'Play the next note on the sheet'): Target {
  return {
    midi,
    ref: midi,
    beats: 1,
    label,
    hint: LANDMARKS[midi % 12],
    spoken: false,
  };
}

/** A tune to read: each note from the sheet, names hidden in the prompt. */
export const readTune = (midis: number[], label?: string): Target[] => midis.map((m) => readTarget(m, label));

export interface RhythmOptions {
  beatsPerBar?: number;
  body?: string;
  bpm?: number;
  /** Play the pattern aloud before the count-in (use it for anything new). */
  listen?: boolean;
}

/** A play-along rhythm. Note lengths in beats; a negative length is a rest. */
export const rhythmStep = (title: string, beats: number[], { beatsPerBar = 4, body, bpm = 60, listen = false }: RhythmOptions = {}): RhythmStep =>
  ({ kind: 'rhythm', title, body, beats, bpm, beatsPerBar, listen });

/** A random item of a list. */
export const pick = <T>(items: T[]): T => items[Math.floor(Math.random() * items.length)];
