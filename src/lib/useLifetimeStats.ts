import { useCallback, useState } from 'react';
import { storage } from './storage';

export interface Counts {
  right: number;
  tries: number;
}

type AllStats = Record<string, Counts>;

const isCounts = (v: unknown): v is Counts =>
  typeof v === 'object' && v !== null &&
  typeof (v as Counts).right === 'number' && typeof (v as Counts).tries === 'number';

function loadAll(): AllStats {
  const raw = storage.get<unknown>('stats', {});
  if (typeof raw !== 'object' || raw === null) return {};
  return Object.fromEntries(Object.entries(raw).filter(([, v]) => isCounts(v))) as AllStats;
}

/** All-time right/tries for one exercise, saved across visits. Pass '' to disable. */
export function useLifetimeStats(id: string) {
  const [counts, setCounts] = useState<Counts>(() => loadAll()[id] ?? { right: 0, tries: 0 });

  const record = useCallback(
    (ok: boolean) => {
      if (!id) return;
      // Read-modify-write straight from storage so two exercises never overwrite each other.
      const all = loadAll();
      const cur = all[id] ?? { right: 0, tries: 0 };
      const next = { right: cur.right + (ok ? 1 : 0), tries: cur.tries + 1 };
      storage.set('stats', { ...all, [id]: next });
      setCounts(next);
    },
    [id],
  );

  return { lifetime: counts, record };
}

export function formatLifetime(c: Counts): string {
  if (c.tries === 0) return 'No attempts yet';
  return `All-time: ${c.right} right of ${c.tries} attempts (${Math.round((c.right / c.tries) * 100)}%)`;
}
