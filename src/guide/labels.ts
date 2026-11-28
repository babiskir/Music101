import { midiToName, noteName } from '../domain/notes';

import type { LabelMode } from './types';

/** The text printed under a note on the staff: both names, one line each ("Do" above "C"). */
export function noteLabel(midi: number): string {
  return `${noteName(midi)}\n${midiToName(midi)}`;
}

/**
 * Labels for a row of notes, in order. 'all' labels every note, 'first' only the first one (a reminder
 * to start from), 'none' nothing. This is how the names fade away over a few exercises.
 */
export function labelsFor(midis: number[], mode: LabelMode | undefined): (string | undefined)[] {
  if (!mode || mode === 'none') return midis.map(() => undefined);
  return midis.map((m, i) => (mode === 'all' || i === 0 ? noteLabel(m) : undefined));
}
