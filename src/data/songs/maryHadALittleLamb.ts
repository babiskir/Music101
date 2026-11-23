import type { Finger, Song, SongNote } from '../../domain/song';

const FINGER: Record<string, Finger> = { C: 1, D: 2, E: 3, F: 4, G: 5 };
const n = (pitch: keyof typeof FINGER, beats = 1): SongNote => ({ pitch: `${pitch}4`, beats, finger: FINGER[pitch] });

const C = (b = 1) => n('C', b);
const D = (b = 1) => n('D', b);
const E = (b = 1) => n('E', b);
const G = (b = 1) => n('G', b);

export const maryHadALittleLamb: Song = {
  id: 'mary-had-a-little-lamb',
  title: 'Mary Had a Little Lamb',
  composer: 'Traditional',
  key: 'C major',
  beatsPerBar: 4,
  targetBpm: 100,
  hand: 'right',
  handPosition:
    'Right hand, the same position as before: thumb on middle C, then D, E, F and G under the other fingers. This song only needs the thumb to the pinky.',
  tips: [
    'The tune only moves by steps, with one skip. Look at the shape on the staff.',
    'Bars 1 and 5 are the same, and so are bars 3 and 7. Learn one and you know the other.',
    'The long notes last two or four beats: hold the key and count.',
  ],
  notes: [
    E(), D(), C(), D(),
    E(), E(), E(2),
    D(), D(), D(2),
    E(), G(), G(2),
    E(), D(), C(), D(),
    E(), E(), E(), E(),
    D(), D(), E(), D(),
    C(4),
  ],
};
