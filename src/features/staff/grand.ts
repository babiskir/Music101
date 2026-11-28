/** A single staff: the treble clef (right hand, middle Do and up) or the bass clef (left hand). */
export type StaffClef = 'treble' | 'bass';
/** What a piece of sheet music is drawn on: one staff, or both joined as a grand staff. */
export type Clef = StaffClef | 'grand';

/** Middle Do (C) and everything above it goes on the treble staff of a grand staff; the rest on the bass staff. */
export const GRAND_SPLIT = 60;

export function staffFor(midi: number, clef: Clef): StaffClef {
  if (clef !== 'grand') return clef;
  return midi >= GRAND_SPLIT ? 'treble' : 'bass';
}

/** Where a rest sits: the middle line of its staff. */
export const REST_KEY: Record<StaffClef, string> = { treble: 'b/4', bass: 'd/3' };
/** A whole rest hangs from the fourth line. */
export const WHOLE_REST_KEY: Record<StaffClef, string> = { treble: 'd/5', bass: 'f/3' };
