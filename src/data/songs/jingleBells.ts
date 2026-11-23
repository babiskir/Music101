import type { Finger, Song, SongNote } from '../../domain/song';

const FINGER: Record<string, Finger> = { C: 1, D: 2, E: 3, F: 4, G: 5 };
const n = (pitch: keyof typeof FINGER, beats = 1): SongNote => ({ pitch: `${pitch}4`, beats, finger: FINGER[pitch] });

const C = (b = 1) => n('C', b);
const D = (b = 1) => n('D', b);
const E = (b = 1) => n('E', b);
const F = (b = 1) => n('F', b);
const G = (b = 1) => n('G', b);

/** The chorus. */
export const jingleBells: Song = {
  id: 'jingle-bells',
  title: 'Jingle Bells (chorus)',
  composer: 'James Lord Pierpont',
  key: 'C major',
  beatsPerBar: 4,
  targetBpm: 110,
  hand: 'right',
  handPosition:
    'Right hand in the usual five-finger position: thumb on middle C, one finger per white key up to G. No hand movement.',
  tips: [
    'The first two bars are the same note three times: "Jin-gle bells". Say the words as you play.',
    'The third bar has a dotted note: the C lasts one and a half beats, then a quick D.',
    'The last bar is the biggest jump, a leap from D to G.',
  ],
  notes: [
    E(), E(), E(2),
    E(), E(), E(2),
    E(), G(), C(1.5), D(0.5),
    E(4),
    F(), F(), F(1.5), F(0.5),
    F(), E(), E(), E(0.5), E(0.5),
    E(), D(), D(), E(),
    D(2), G(2),
  ],
};
