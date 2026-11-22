import type { Song, SongNote } from '../../domain/song';

// Right hand, five-finger position: thumb on C4, then D E F G under fingers 2-5.
const F = { C: 1, D: 2, E: 3, F: 4, G: 5 } as const;
const n = (pitch: keyof typeof F, beats: number): SongNote => ({
  pitch: `${pitch}4`,
  beats,
  finger: F[pitch],
});

export const odeToJoy: Song = {
  id: 'ode-to-joy',
  title: 'Ode to Joy',
  composer: 'Beethoven',
  key: 'C major',
  beatsPerBar: 4,
  targetBpm: 100,
  hand: 'right',
  handPosition:
    'Right hand: thumb on middle C (the C in the middle of the keyboard), one finger per key — C D E F G, thumb to pinky. You never have to move your hand.',
  tips: [
    'Start at 50-60 BPM. Speed comes by itself; wrong notes practiced slowly become habits.',
    'Say the finger numbers out loud: 3 3 4 5 | 5 4 3 2 | 1 1 2 3 | 3. 2 2',
    'Bars 4 and 8 have a dotted note (1.5 beats) followed by a short one — listen with "Hear notes" on.',
    'Master 4 bars at a time before playing the whole thing.',
  ],
  notes: [
    // Bar 1-2
    n('E', 1), n('E', 1), n('F', 1), n('G', 1),
    n('G', 1), n('F', 1), n('E', 1), n('D', 1),
    // Bar 3-4
    n('C', 1), n('C', 1), n('D', 1), n('E', 1),
    n('E', 1.5), n('D', 0.5), n('D', 2),
    // Bar 5-6
    n('E', 1), n('E', 1), n('F', 1), n('G', 1),
    n('G', 1), n('F', 1), n('E', 1), n('D', 1),
    // Bar 7-8
    n('C', 1), n('C', 1), n('D', 1), n('E', 1),
    n('D', 1.5), n('C', 0.5), n('C', 2),
  ],
};
