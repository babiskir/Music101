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

/** Letter name without octave: 61 -> "C#". */
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

/** Letters of a pitch class: "C", or "C#/Db" for black keys. */
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

// The player learns two names for every note, with equal weight: fixed do (Do = C, ... Si = B) and the
// letters. Inside the code, pitches are written with letters ("C4").
const SYLLABLES: Record<string, string> = { C: 'Do', D: 'Re', E: 'Mi', F: 'Fa', G: 'Sol', A: 'La', B: 'Si' };
/** Spellings that make an English speech voice say the syllables properly. */
const SPOKEN: Record<string, string> = { C: 'Doh', D: 'Ray', E: 'Mee', F: 'Fah', G: 'Sohl', A: 'Lah', B: 'See' };

/** Note name without octave: 60 -> "Do", 61 -> "Do♯". */
export function noteName(midi: number): string {
  const [letter, sharp] = NAMES[midi % 12];
  return SYLLABLES[letter] + (sharp ? '♯' : '');
}

/** Name of a pitch class: "Do", or "Do♯/Re♭" for black keys. */
export function pitchClassName(pc: number): string {
  return NAMES[pc].includes('#') ? `${noteName(pc)}/${SYLLABLES[FLAT_NAMES[pc][0]]}♭` : noteName(pc);
}

/** Both names of a note: "Do (C)", "Do♯ (C#)". */
export function bothNames(midi: number): string {
  return `${noteName(midi)} (${midiToName(midi)})`;
}

/** Both names of a pitch class, flats included: "Do (C)", "Do♯/Re♭ (C#/Db)". */
export function bothClassNames(pc: number): string {
  return `${pitchClassName(pc)} (${pitchClassLabel(pc)})`;
}

/** How the syllable of a pitch class is said aloud ("Fah sharp"); black keys are always said as sharps. */
export function spokenName(pc: number): string {
  const [letter, sharp] = NAMES[pc];
  return SPOKEN[letter] + (sharp ? ' sharp' : '');
}

/** How its letter is said aloud: "F sharp". */
export function spokenLetter(pc: number): string {
  return NAMES[pc].replace('#', ' sharp');
}

/** Both, one after the other: "Doh, C". */
export function spokenBoth(pc: number): string {
  return `${spokenName(pc)}, ${spokenLetter(pc)}`;
}
