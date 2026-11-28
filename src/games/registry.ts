import { lazy } from 'react';
import { CHORD_LEVELS } from './chordLock/logic';
import { HOP_LEVELS } from './hopAlong/logic';
import { RAIN_LEVELS } from './noteRain/logic';
import { RHYTHM_LEVELS } from './rhythmRoad/judge';
import type { GameDef } from './types';

/**
 * The practice games, in the order of the Practice menu. Each game's 3D code is loaded only when it is
 * played (lazy), so the lessons stay light. `lessons` are the lesson ids the game practises.
 */
export const games: GameDef[] = [
  {
    id: 'note-rain',
    title: 'Note Rain',
    icon: '💎',
    tagline: 'Gems fall with a note on them. Play its key before it lands.',
    howTo: [
      'The lowest gem is the one to play. Read it, find the key, play it.',
      'A note name accepts that note in any octave; a note on the staff needs that exact key.',
      'Play it quickly for full points. When a gem gets close, its key glows: still counts, but for less.',
      'Three lives. A wrong key costs nothing but your streak.',
    ],
    lessons: ['find-the-key', 'do-re-mi', 'staff-three-notes', 'staff-five-notes', 'staff-landmarks', 'reading-notes', 'bass-clef', 'left-hand-tunes'],
    levels: RAIN_LEVELS,
    Play: lazy(() => import('./noteRain/NoteRainGame')),
  },
  {
    id: 'rhythm-road',
    title: 'Rhythm Road',
    icon: '🥁',
    tagline: 'Orbs roll toward the line. Press any key exactly as one touches it.',
    howTo: [
      'After a count-in of four clicks, the orbs arrive one by one. Press any key when one touches the glowing line.',
      'The thin tail shows how long the note lasts: a half note has a tail twice as long as a quarter note.',
      'Perfect and good hits build a streak. The game learns your usual delay, so a microphone is fine.',
    ],
    lessons: ['rhythm-basics', 'bars-and-meter'],
    levels: RHYTHM_LEVELS,
    Play: lazy(() => import('./rhythmRoad/RhythmRoadGame')),
  },
  {
    id: 'chord-lock',
    title: 'Chord Lock',
    icon: '🔓',
    tagline: 'Open the lock by playing the three notes of the chord.',
    howTo: [
      'A chord name appears: Do (C), Fa (F) or Sol (G). Play its three notes, one after another, in any order.',
      'A chord is built by skipping a key between the notes. Any octave counts.',
      'A wrong note is a slip: the chord still opens, but for fewer points.',
    ],
    lessons: ['chords'],
    levels: CHORD_LEVELS,
    Play: lazy(() => import('./chordLock/ChordLockGame')),
  },
  {
    id: 'hop-along',
    title: 'Hop Along',
    icon: '🐸',
    tagline: 'Tell the frog how far to hop: a step, a skip or a leap.',
    howTo: [
      'The frog sits on a white key. The prompt says how far and which way it must hop.',
      'A step is the very next white key, a skip jumps over one, a leap is three keys or more.',
      'Play the key it should land on. It hops there, and you get the next order.',
    ],
    lessons: ['steps-and-skips', 'higher-or-lower'],
    levels: HOP_LEVELS,
    Play: lazy(() => import('./hopAlong/HopAlongGame')),
  },
];

export const findGame = (id: string): GameDef | undefined => games.find((g) => g.id === id);
