import { pitchToMidi } from './notes';

export interface Instrument {
  name: string;
  /** Lowest / highest key as MIDI numbers. */
  lowest: number;
  highest: number;
}

/** Casio Casiotone CT-S100: 61 full-size-ish keys, C2 to C6. */
export const CT_S100: Instrument = {
  name: 'Casio CT-S100',
  lowest: pitchToMidi('C2'),
  highest: pitchToMidi('C6'),
};
