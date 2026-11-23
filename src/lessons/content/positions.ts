import { pitchToMidi } from '../../domain/notes';
import type { Finger } from '../../domain/song';

export type Hand = 'right' | 'left';

export interface HandPositionDef {
  label: string;
  /** Keyboard window to display (MIDI numbers, C to C). */
  range: [number, number];
  /** Which key each finger rests on. */
  keys: Record<Finger, number>;
  description: string;
}

export const FINGERS: Finger[] = [1, 2, 3, 4, 5];

/** "C position": the standard first hand position for each hand. */
export const POSITIONS: Record<Hand, HandPositionDef> = {
  right: {
    label: 'Right hand',
    range: [pitchToMidi('C4'), pitchToMidi('C5')],
    keys: {
      1: pitchToMidi('C4'),
      2: pitchToMidi('D4'),
      3: pitchToMidi('E4'),
      4: pitchToMidi('F4'),
      5: pitchToMidi('G4'),
    },
    description:
      'Thumb on middle C, then one finger per white key going right: index on D, middle on E, ring on F, and the pinky on G.',
  },
  left: {
    label: 'Left hand',
    range: [pitchToMidi('C3'), pitchToMidi('C4')],
    keys: {
      5: pitchToMidi('C3'),
      4: pitchToMidi('D3'),
      3: pitchToMidi('E3'),
      2: pitchToMidi('F3'),
      1: pitchToMidi('G3'),
    },
    description:
      'Pinky on the C one octave below middle C, then ring on D, middle on E, index on F, and the thumb on G. It mirrors the right hand: the thumbs meet in the middle.',
  },
};

export const POSTURE_TIPS = [
  'Sit centered on the keyboard, forearms level with the keys.',
  'Curve your fingers like you are holding a small ball; play with the fingertips.',
  'Keep your wrist level and relaxed, not drooping or lifted.',
  'Rest your fingers on the keys first without pressing. Then press one at a time.',
  'The thumb plays on its side-tip, not flat.',
];
