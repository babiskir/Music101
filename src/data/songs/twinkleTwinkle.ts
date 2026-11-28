import type { Finger, Song, SongNote } from '../../domain/song';

const n = (pitch: string, finger: Finger, beats = 1): SongNote => ({ pitch: `${pitch}4`, beats, finger });

const C = (b = 1) => n('C', 1, b);
const D = (b = 1) => n('D', 2, b);
const E = (b = 1) => n('E', 3, b);
const F = (b = 1) => n('F', 4, b);
const G = (b = 1) => n('G', 5, b);
const A = (b = 1) => n('A', 5, b); // pinky stretches one key up from G

export const twinkleTwinkle: Song = {
  id: 'twinkle-twinkle',
  title: 'Twinkle, Twinkle, Little Star',
  key: 'C major',
  beatsPerBar: 4,
  targetBpm: 100,
  hand: 'right',
  handPosition:
    'Right hand: thumb on middle Do (C), one finger per key up to Sol (G). The only new thing is La (A): stretch your pinky one key past Sol (or let the whole hand slide up a key).',
  tips: [
    'Only 3 ideas: "Do Do Sol Sol La La Sol" / "Fa Fa Mi Mi Re Re Do" / "Sol Sol Fa Fa Mi Mi Re" (C C G G A A G / F F E E D D C / G G F F E E D). Learn each line separately.',
    'The jump Do to Sol, C to G (bar 1) is a leap of a fifth — thumb to pinky. Practice just that.',
    'Lines 3 and 4 are identical, and the song ends by repeating line 1 and 2.',
  ],
  notes: [
    C(), C(), G(), G(), A(), A(), G(2),
    F(), F(), E(), E(), D(), D(), C(2),
    G(), G(), F(), F(), E(), E(), D(2),
    G(), G(), F(), F(), E(), E(), D(2),
    C(), C(), G(), G(), A(), A(), G(2),
    F(), F(), E(), E(), D(), D(), C(2),
  ],
};
