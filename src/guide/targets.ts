import { CT_S100 } from '../domain/instrument';
import {
  bothClassNames, bothNames, isBlackKey, pitchClassLabel, pitchClassName, spokenBoth, spokenLetter, spokenName,
} from '../domain/notes';
import { FINGER_NAMES, type Finger } from '../domain/song';
import { LANDMARKS } from './landmarks';
import type { StaffClef } from '../features/staff/grand';
import type { Notation, Target } from './types';

/** Does this key satisfy the target? (An exact key, or any key its `match` accepts.) */
export const accepts = (t: Target, midi: number): boolean =>
  t.keys ? t.keys.includes(midi) : t.midi !== undefined ? midi === t.midi : !!t.match && t.match(midi);

/** The keys between `from` and `to` (inclusive) that would be right for a target. */
export function keysAccepting(t: Target, from: number, to: number): number[] {
  const keys: number[] = [];
  for (let m = from; m <= to; m++) if (accepts(t, m)) keys.push(m);
  return keys;
}

/** Quiz card showing a note name (Do..Si, Fa♯): any octave of that note is right. */
export function nameTarget(midi: number): Target {
  const pc = midi % 12;
  return {
    present: 'name',
    ref: midi,
    match: (m) => m % 12 === pc,
    label: pitchClassName(pc),
    chip: bothNames(midi),
    hint: LANDMARKS[pc],
    spoken: `Play ${spokenName(pc)}`,
  };
}

/** Quiz card showing the letter (C = Do): any octave of that note is right. */
export function letterTarget(midi: number): Target {
  const pc = midi % 12;
  return {
    ...nameTarget(midi),
    label: pitchClassLabel(pc),
    spoken: `Play ${spokenLetter(pc)}`,
  };
}

/** Quiz card showing one note on the staff: exactly that key is right. */
export function staffTarget(midi: number, clef: StaffClef = 'treble'): Target {
  const pc = midi % 12;
  return {
    present: 'staff',
    clef,
    ref: midi,
    midi,
    hint: `That note is ${bothClassNames(pc)}. ${LANDMARKS[pc]}`,
    spoken: false,
  };
}

/**
 * A list of quiz prompts drawn from `pool` (MIDI numbers). No pitch twice in a row; in 'mixed' mode
 * the presentation switches between staff and name, never more than twice in a row the same way.
 * Written prompts take turns between Do Re Mi and letters, so each gets half.
 */
export function quizTargets(pool: number[], count: number, notation: Notation, clef: StaffClef = 'treble'): Target[] {
  const out: Target[] = [];
  let prev = -1;
  let streakKind: 'name' | 'staff' = 'name';
  let streak = 0;
  let asLetter = Math.random() < 0.5;
  for (let i = 0; i < count; i++) {
    const candidates = pool.filter((m) => m !== prev);
    const midi = candidates[Math.floor(Math.random() * candidates.length)];
    prev = midi;
    let kind: 'name' | 'staff' = notation === 'mixed' ? (Math.random() < 0.5 ? 'name' : 'staff') : notation === 'staff' ? 'staff' : 'name';
    if (notation === 'mixed' && streak >= 2 && kind === streakKind) kind = kind === 'name' ? 'staff' : 'name';
    streak = kind === streakKind ? streak + 1 : 1;
    streakKind = kind;
    if (kind === 'staff') out.push(staffTarget(midi, clef));
    else {
      out.push(asLetter ? letterTarget(midi) : nameTarget(midi));
      asLetter = !asLetter;
    }
  }
  return out;
}

/** An exact key shown as plain text (e.g. a name or "Middle Do") in a sequence. */
export function keyTarget(midi: number, label?: string): Target {
  return { midi, ref: midi, label: label ?? bothNames(midi), chip: bothNames(midi), hint: LANDMARKS[midi % 12] };
}

/** "Play any key like this" (any key satisfying `match`), e.g. any black key in a group of two. */
export function anyKey(label: string, match: (midi: number) => boolean, hint?: string): Target {
  return { match, label, chip: '•', hint, spoken: label };
}

/** "thumb", "index finger", ...: fingers are always named in words, never numbered. */
export function fingerPhrase(finger: Finger): string {
  return finger === 1 ? FINGER_NAMES[1] : `${FINGER_NAMES[finger]} finger`;
}

/** The player sees the note name and which finger to use, in words. */
export function fingerTarget(position: Record<Finger, number>, finger: Finger): Target {
  const midi = position[finger];
  return {
    midi,
    ref: midi,
    finger,
    label: `${bothNames(midi)} · ${fingerPhrase(finger)}`,
    chip: bothNames(midi),
    hint: `Your ${fingerPhrase(finger)} rests on ${bothNames(midi)}.`,
    spoken: `Play ${spokenBoth(midi % 12)}, with your ${fingerPhrase(finger)}`,
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
