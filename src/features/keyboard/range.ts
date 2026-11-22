import type { Instrument } from '../../domain/instrument';

/** Smallest whole-octave window (C to C) that contains all notes, clamped to the instrument. */
export function rangeForNotes(midis: number[], instrument: Instrument): [number, number] {
  const lo = Math.min(...midis);
  const hi = Math.max(...midis);
  const from = Math.max(instrument.lowest, Math.floor(lo / 12) * 12);
  const to = Math.min(instrument.highest, (Math.floor(hi / 12) + 1) * 12);
  return [from, to];
}
