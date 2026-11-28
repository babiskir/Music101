import type { Pitch } from './notes';

export type Finger = 1 | 2 | 3 | 4 | 5;

/** Index by finger number (1-5). */
export const FINGER_NAMES = ['', 'thumb', 'index', 'middle', 'ring', 'pinky'] as const;

export interface SongNote {
  pitch: Pitch;
  /** Length in beats (quarter note = 1 in x/4 time). */
  beats: number;
  /** 1 = thumb ... 5 = pinky. */
  finger?: Finger;
}

export interface Song {
  id: string;
  title: string;
  composer?: string;
  key: string;
  beatsPerBar: number;
  /** Suggested tempo once the song is comfortable. Start slower! */
  targetBpm: number;
  hand: 'right' | 'left';
  /** Plain-language "where do I put my hand" instruction. */
  handPosition: string;
  tips: string[];
  notes: SongNote[];
}

export interface TimedNote extends SongNote {
  /** Position of the note's start, in beats from the beginning of the song. */
  startBeat: number;
  /** A rest: silence for `beats` (the pitch is ignored). */
  rest?: boolean;
  /** Other notes that sound at the same time as `pitch` (both hands, chords). */
  also?: Pitch[];
}

export function withTiming(song: Song): TimedNote[] {
  let cursor = 0;
  return song.notes.map((n) => {
    const timed = { ...n, startBeat: cursor };
    cursor += n.beats;
    return timed;
  });
}

export function totalBeats(song: Song): number {
  return song.notes.reduce((sum, n) => sum + n.beats, 0);
}
