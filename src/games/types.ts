import type { ComponentType } from 'react';
import type { Stars } from './scoring';

export interface GameLevel {
  id: string;
  title: string;
  blurb: string;
}

/** What a finished round reports back to the game screen. */
export interface GameResult {
  score: number;
  stars: Stars;
  /** One line: "Great reading!" */
  headline: string;
  /** A few facts about the round: "14 of 16 right", "Best streak: 9". */
  details: string[];
}

export interface GamePlayProps {
  level: GameLevel;
  onFinish: (result: GameResult) => void;
}

/**
 * A practice game: a short round played on the piano, drawn in 3D. Each one revisits a few lessons,
 * so the hub can tell which game fits where the player is.
 */
export interface GameDef {
  id: string;
  title: string;
  icon: string;
  /** One line on the game card. */
  tagline: string;
  /** How to play, a few short bullets. */
  howTo: string[];
  /** Ids of the lessons this game practises (see src/lessons/registry.ts). */
  lessons: string[];
  levels: GameLevel[];
  Play: ComponentType<GamePlayProps>;
}
