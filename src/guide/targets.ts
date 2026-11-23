import { CT_S100 } from '../domain/instrument';
import { isBlackKey, midiToName, pitchClassLabel, solfege, spokenName } from '../domain/notes';
import { FINGER_NAMES, type Finger } from '../domain/song';
import { LANDMARKS } from './landmarks';
import type { Notation, Target } from './types';

/** Quiz card showing a letter (A..G, F#): any octave of that note is right. */
export function letterTarget(midi: number): Target {
  const pc = midi % 12;
  return {
    present: 'name',
    ref: midi,
    match: (m) => m % 12 === pc,
    label: pitchClassLabel(pc),
    chip: midiToName(midi),
    hint: LANDMARKS[pc],
    spoken: `Play ${spokenName(pc)}`,
  };
}

/** Quiz card showing a syllable (do re mi...): any octave of that note is right. Black keys fall back to letters. */
export function solfegeTarget(midi: number): Target {
  const syllable = solfege(midi);
  if (!syllable) return letterTarget(midi);
  const pc = midi % 12;
  return {
    present: 'name',
    ref: midi,
    match: (m) => m % 12 === pc,
    label: syllable,
    chip: midiToName(midi),
    hint: `${syllable} is ${pitchClassLabel(pc)}. ${LANDMARKS[pc]}`,
    spoken: `Play ${syllable}`,
  };
}

/** Quiz card showing one note on the staff: exactly that key is right. */
export function staffTarget(midi: number): Target {
  const pc = midi % 12;
  return {
    present: 'staff',
    ref: midi,
    midi,
    hint: `That note is ${pitchClassLabel(pc)}. ${LANDMARKS[pc]}`,
    spoken: false,
  };
}

/**
 * A list of quiz prompts drawn from `pool` (MIDI numbers). No pitch twice in a row; in 'mixed' mode
 * the presentation switches between staff and letter, never more than twice in a row the same way.
 */
export function quizTargets(pool: number[], count: number, notation: Notation): Target[] {
  const out: Target[] = [];
  let prev = -1;
  let streakKind: 'name' | 'staff' = 'name';
  let streak = 0;
  for (let i = 0; i < count; i++) {
    const candidates = pool.filter((m) => m !== prev);
    const midi = candidates[Math.floor(Math.random() * candidates.length)];
    prev = midi;
    let kind: 'name' | 'staff' = notation === 'mixed' ? (Math.random() < 0.5 ? 'name' : 'staff') : notation === 'staff' ? 'staff' : 'name';
    if (notation === 'mixed' && streak >= 2 && kind === streakKind) kind = kind === 'name' ? 'staff' : 'name';
    streak = kind === streakKind ? streak + 1 : 1;
    streakKind = kind;
    out.push(notation === 'solfege' ? solfegeTarget(midi) : kind === 'name' ? letterTarget(midi) : staffTarget(midi));
  }
  return out;
}

/** An exact key shown as plain text (e.g. a letter or "Middle C") in a sequence. */
export function keyTarget(midi: number, label?: string): Target {
  return { midi, ref: midi, label: label ?? midiToName(midi), chip: midiToName(midi), hint: LANDMARKS[midi % 12] };
}

/** "Play any key like this" (any key satisfying `match`), e.g. any black key in a group of two. */
export function anyKey(label: string, match: (midi: number) => boolean, hint?: string): Target {
  return { match, label, chip: '•', hint, spoken: label };
}

/** "thumb", "index finger", ...: fingers are always named in words, never numbered. */
export function fingerPhrase(finger: Finger): string {
  return finger === 1 ? FINGER_NAMES[1] : `${FINGER_NAMES[finger]} finger`;
}

/** The player sees the note (a letter) and which finger to use, in words. */
export function fingerTarget(position: Record<Finger, number>, finger: Finger): Target {
  const midi = position[finger];
  return {
    midi,
    ref: midi,
    finger,
    label: `${midiToName(midi)} · ${fingerPhrase(finger)}`,
    chip: midiToName(midi),
    hint: `Your ${fingerPhrase(finger)} rests on ${midiToName(midi)}.`,
    spoken: `Play ${spokenName(midi % 12)} with your ${fingerPhrase(finger)}`,
  };
}

/** White keys from `from` to `to` inclusive. */
export function whiteKeys(from: number, to: number): number[] {
  const out: number[] = [];
  for (let m = from; m <= to; m++) if (!isBlackKey(m)) out.push(m);
  return out;
}

/** Every key from `from` to `to` inclusive. */
export function allKeys(from: number, to: number): number[] {
  return Array.from({ length: to - from + 1 }, (_, i) => from + i);
}

export const KEYBOARD_RANGE: [number, number] = [CT_S100.lowest, CT_S100.highest];
