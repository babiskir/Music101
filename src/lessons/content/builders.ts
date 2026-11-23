import { midiToName, solfege } from '../../domain/notes';
import { LANDMARKS } from '../../guide/landmarks';
import type { Finger } from '../../domain/song';
import { fingerPhrase } from '../../guide/targets';
import type { Target } from '../../guide/types';

/** One exact key to play, optionally with a finger (named in words) and a length for the sheet music. */
export function noteTarget(midi: number, opts: { finger?: Finger; note?: string; hint?: string } = {}): Target {
  const { finger, note, hint } = opts;
  const name = midiToName(midi);
  const parts = [name, finger ? fingerPhrase(finger) : '', note ?? ''].filter(Boolean);
  return {
    midi,
    ref: midi,
    finger,
    beats: 1,
    label: parts.join(' · '),
    chip: name,
    hint,
    spoken: `Play ${name.replace('#', ' sharp')}`,
  };
}

/**
 * A note to read from the sheet music: the prompt does NOT give away the letter (no chip either).
 * The hint (after a pause) does.
 */
export function readTarget(midi: number, label = 'Play the next note on the sheet'): Target {
  return {
    midi,
    ref: midi,
    beats: 1,
    label,
    hint: `That note is ${midiToName(midi)}. ${LANDMARKS[midi % 12]}`,
    spoken: false,
  };
}

/** A tune to read: each note from the sheet, letters hidden in the prompt. */
export const readTune = (midis: number[], label?: string): Target[] => midis.map((m) => readTarget(m, label));

/** A note named by its syllable (do re mi...), with the letter on the little chip. */
export function syllableTarget(midi: number): Target {
  const syllable = solfege(midi) ?? midiToName(midi);
  return { midi, ref: midi, beats: 1, label: syllable, chip: midiToName(midi), hint: LANDMARKS[midi % 12], spoken: `Play ${syllable}` };
}

/** A random item of a list. */
export const pick = <T>(items: T[]): T => items[Math.floor(Math.random() * items.length)];
