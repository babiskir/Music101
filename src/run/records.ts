import { numberFields, storedTable } from '../lib/storage';
import { PICKS } from './modifiers';

/** Saved per run kind: "keyboard", "keyboard-hard", "daily"… */
export interface RunRecord {
  best: number;
  runs: number;
  wins: number;
  bestStreak: number;
}

const byId = storedTable('runs', numberFields<RunRecord>('best', 'runs', 'wins', 'bestStreak'));
/** Best daily-run score per date (2026-11-28). */
const daily = storedTable('runs.daily', (v): v is number => typeof v === 'number');

interface AllRecords {
  byId: Record<string, RunRecord>;
  daily: Record<string, number>;
}

export const loadRecords = (): AllRecords => ({ byId: byId.all(), daily: daily.all() });

export const recordOf = (id: string, all = loadRecords()): RunRecord =>
  all.byId[id] ?? { best: 0, runs: 0, wins: 0, bestStreak: 0 };

/** Runs and wins over all kinds of run: these unlock new twists and perks. */
export function totals(all = loadRecords()): { runs: number; wins: number } {
  return Object.values(all.byId).reduce((t, r) => ({ runs: t.runs + r.runs, wins: t.wins + r.wins }), { runs: 0, wins: 0 });
}

/** Hard mode of a class opens after one won normal run of it. */
export const hardUnlocked = (classId: string, all = loadRecords()): boolean => recordOf(classId, all).wins > 0;

export interface Saved {
  record: RunRecord;
  isBest: boolean;
  /** Things this run opened up, in words. */
  unlocked: string[];
}

/** Save a finished run and report what it unlocked. */
export function saveRun(id: string, result: { score: number; won: boolean; bestStreak: number }, opts: { daily?: string; classId?: string } = {}): Saved {
  const all = loadRecords();
  const before = totals(all);
  const hardBefore = opts.classId ? hardUnlocked(opts.classId, all) : true;
  const prev = recordOf(id, all);
  const record: RunRecord = {
    best: Math.max(prev.best, result.score),
    runs: prev.runs + 1,
    wins: prev.wins + (result.won ? 1 : 0),
    bestStreak: Math.max(prev.bestStreak, result.bestStreak),
  };
  byId.set(id, record);
  if (opts.daily) daily.set(opts.daily, Math.max(all.daily[opts.daily] ?? 0, result.score));
  const next = loadRecords();

  const after = totals(next);
  const reached = (need: { runs?: number; wins?: number }) =>
    after.runs >= (need.runs ?? 0) && after.wins >= (need.wins ?? 0) &&
    !(before.runs >= (need.runs ?? 0) && before.wins >= (need.wins ?? 0));
  const unlocked = PICKS.filter((p) => p.unlock && reached(p.unlock)).map((p) => `New ${p.kind}: ${p.title}`);
  if (opts.classId && !hardBefore && hardUnlocked(opts.classId, next)) unlocked.push('Hard mode for this class');
  return { record, isBest: result.score > prev.best, unlocked };
}
