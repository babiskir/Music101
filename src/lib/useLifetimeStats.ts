import { useCallback, useState } from 'react';
import { numberFields, storedTable } from './storage';

export interface Counts {
  right: number;
  tries: number;
}

const stats = storedTable('stats', numberFields<Counts>('right', 'tries'));

/** All-time right/tries for one exercise, saved across visits. Pass '' to disable. */
export function useLifetimeStats(id: string) {
  const [counts, setCounts] = useState<Counts>(() => stats.get(id) ?? { right: 0, tries: 0 });

  const record = useCallback(
    (ok: boolean) => {
      if (!id) return;
      const cur = stats.get(id) ?? { right: 0, tries: 0 };
      const next = { right: cur.right + (ok ? 1 : 0), tries: cur.tries + 1 };
      stats.set(id, next);
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
