import type { Finger } from '../domain/song';
import type { KeyHighlight } from '../features/keyboard/Keyboard';

/**
 * How a quiz writes the note it asks for. Never with octave numbers ("C4"):
 *  - 'name'  : a letter, A to G, with sharps (F#). Any octave of that note counts.
 *  - 'staff' : a note on the treble staff. Exactly that key counts.
 *  - 'mixed' : each prompt randomly one or the other.
 */
export type Notation = 'name' | 'staff' | 'mixed' | 'solfege';

/** Letters printed under the notes of a staff: on every note, only the first, or none (they fade away). */
export type LabelMode = 'all' | 'first' | 'none';

/** One thing the player has to play. */
export interface Target {
  /** Accept exactly this key... */
  midi?: number;
  /** ...or any key for which this returns true (e.g. any octave of F#). One of the two is required. */
  match?: (midi: number) => boolean;
  /** A key on the keyboard that stands for this target (keyboard range, staff note). */
  ref?: number;
  /** Quiz card presentation: a big letter or a single note on the staff. Omit for a plain text target. */
  present?: 'name' | 'staff';
  /** Big text: the letter, "Finger 3 (middle)", "Middle C"... */
  label?: string;
  /** Small label on the progress chips (omit to hide the answer). */
  chip?: string;
  finger?: Finger;
  /** Length in beats (songs). */
  beats?: number;
  /** Shown when the player seems stuck. */
  hint?: string;
  /** What to say aloud if spoken instructions are on. Omit or false for silence. */
  spoken?: string | false;
}

/** What the screen shows besides the instruction. */
export interface Show {
  /** Highlight the key to play on the keyboard (otherwise only after a pause: the hint). */
  keys?: boolean;
  /** Put the finger numbers on the highlighted keys. */
  fingers?: boolean;
  /** Sheet music for the whole sequence, with the current note lit (songs and runs). */
  staff?: boolean;
  /** Letter names under the notes of the sheet music (default none). */
  labels?: LabelMode;
  /** Add do-re-mi next to the letters (fixed do: do = C). */
  solfege?: boolean;
}

/** Read-and-continue screen. Advances when the player presses any key on the piano. */
export interface InfoStep {
  kind: 'info';
  title: string;
  body: string[];
  /** Optional bullet list. */
  list?: string[];
  /** Optional picture of the keyboard with some keys marked. */
  keyboard?: { from: number; to: number; keys?: Record<number, KeyHighlight>; names?: boolean };
  /** Optional picture of a few notes on the staff, left to right, one beat each. */
  staff?: { notes: number[]; labels?: LabelMode; solfege?: boolean };
}

/** "Play this" step: the app listens and advances by itself. */
export interface PlayStep {
  kind: 'play';
  title: string;
  body?: string;
  targets: Target[] | (() => Target[]);
  show?: Show;
  /** Keyboard window (white keys at both ends). Defaults to the octaves the targets use. */
  keyboard?: [number, number];
  /** Letter names printed on the on-screen keys. Default true; turn off for "find it yourself" quizzes. */
  names?: boolean;
  /** Seconds-in-ms of silence before the hint appears (default 10000). */
  hintAfterMs?: number;
  beatsPerBar?: number;
}

/** Play along with the metronome; the app grades how steady you are. */
export interface RhythmStep {
  kind: 'rhythm';
  title: string;
  body?: string;
  /** Note lengths in beats, e.g. [1, 1, 2]. */
  beats: number[];
  bpm: number;
  beatsPerBar?: number;
  /** Play the pattern aloud first (the notes light up as they sound), then count in. For new rhythms. */
  listen?: boolean;
}

/** One question of a "choose" step. */
export interface Choice {
  /** The question, in words. */
  prompt: string;
  /** Notes (MIDI) drawn on the staff, left to right, and played when "Hear it" is pressed. */
  notes?: number[];
  /** Letters printed under those notes. */
  labels?: LabelMode;
  solfege?: boolean;
  options: string[];
  /** Index into `options`. */
  answer: number;
  hint?: string;
}

/** Tap the right answer with the mouse or touch: higher or lower, step or skip... */
export interface ChooseStep {
  kind: 'choose';
  title: string;
  body?: string;
  choices: Choice[] | (() => Choice[]);
}

export type Step = InfoStep | PlayStep | RhythmStep | ChooseStep;
