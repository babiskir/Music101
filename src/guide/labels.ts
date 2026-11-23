import { midiToName, solfege } from '../domain/notes';
import type { LabelMode } from './types';

/** The text printed under a note on the staff: "C", or "C · do" when syllables are on. */
export function noteLabel(midi: number, withSolfege: boolean): string {
  const syllable = withSolfege ? solfege(midi) : undefined;
  return syllable ? `${midiToName(midi)} · ${syllable}` : midiToName(midi);
}

/**
 * Labels for a row of notes, in order. 'all' labels every note, 'first' only the first one (a reminder
 * to start from), 'none' nothing. This is how the letters fade away over a few exercises.
 */
export function labelsFor(midis: number[], mode: LabelMode | undefined, withSolfege = false): (string | undefined)[] {
  if (!mode || mode === 'none') return midis.map(() => undefined);
  return midis.map((m, i) => (mode === 'all' || i === 0 ? noteLabel(m, withSolfege) : undefined));
}
