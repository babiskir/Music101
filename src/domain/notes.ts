/** A pitch in scientific notation, e.g. "C4" (middle C), "F#3", "Bb4". */
export type Pitch = string;

const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;
const BASE: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const BLACK_PITCH_CLASSES = new Set([1, 3, 6, 8, 10]);

/** "C4" -> 60 (MIDI note number; also what the CT-S100 sends over USB-MIDI). */
export function pitchToMidi(pitch: Pitch): number {
  const m = /^([A-G])(#|b)?(-?\d)$/.exec(pitch);
  if (!m) throw new Error(`Invalid pitch: ${pitch}`);
  const accidental = m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0;
  return (Number(m[3]) + 1) * 12 + BASE[m[1]] + accidental;
}

export function midiToPitch(midi: number): Pitch {
  return `${NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`;
}

/** Note name without octave: 61 -> "C#". */
export function midiToName(midi: number): string {
  return NAMES[midi % 12];
}

export function isBlackKey(midi: number): boolean {
  return BLACK_PITCH_CLASSES.has(midi % 12);
}

export function midiToFrequency(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}

const FLAT_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'] as const;

/** Label for a pitch class: "C", or "C#/Db" for black keys. */
export function pitchClassLabel(pc: number): string {
  return NAMES[pc].includes('#') ? `${NAMES[pc]}/${FLAT_NAMES[pc]}` : NAMES[pc];
}

/** "C#4 / Db4" for black keys, plain "C4" for white keys. */
export function describePitch(midi: number): string {
  const octave = Math.floor(midi / 12) - 1;
  return isBlackKey(midi)
    ? `${NAMES[midi % 12]}${octave} / ${FLAT_NAMES[midi % 12]}${octave}`
    : midiToPitch(midi);
}

/** How a pitch class is said aloud: "F sharp", "D flat" is avoided by always using the sharp name. */
export function spokenName(pc: number): string {
  return NAMES[pc].replace('#', ' sharp');
}
