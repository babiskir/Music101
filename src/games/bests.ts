import { storedTable } from '../lib/storage';
import type { Stars } from './scoring';

export interface Best {
  score: number;
  stars: Stars;
}

const isBest = (v: unknown): v is Best =>
  typeof v === 'object' && v !== null &&
  typeof (v as Best).score === 'number' && [0, 1, 2, 3].includes((v as Best).stars);

const bests = storedTable('games.best', isBest);
const keyOf = (gameId: string, levelId: string) => `${gameId}/${levelId}`;

export const getBest = (gameId: string, levelId: string): Best | undefined => bests.get(keyOf(gameId, levelId));

/** Combine an earlier best with a new result: the best score and the most stars ever earned. */
export function mergeBest(prev: Best | undefined, result: Best): { best: Best; isRecord: boolean } {
  if (!prev) return { best: result, isRecord: result.score > 0 };
  return {
    best: { score: Math.max(prev.score, result.score), stars: Math.max(prev.stars, result.stars) as Stars },
    isRecord: result.score > prev.score,
  };
}

/** Save a finished round. */
export function recordResult(gameId: string, levelId: string, result: Best): { best: Best; isRecord: boolean } {
  const merged = mergeBest(getBest(gameId, levelId), result);
  bests.set(keyOf(gameId, levelId), merged.best);
  return merged;
}
