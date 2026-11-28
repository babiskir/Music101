import { useEffect, useMemo, useRef } from 'react';

/**
 * setTimeout that belongs to a component: everything still pending is cancelled when it goes away
 * (a skipped step must never fire its "done" into the next one), or earlier with `clear()`.
 */
export function useTimers() {
  const ids = useRef(new Set<number>());
  const timers = useMemo(
    () => ({
      later(fn: () => void, ms: number): void {
        const id = window.setTimeout(() => {
          ids.current.delete(id);
          fn();
        }, ms);
        ids.current.add(id);
      },
      clear(): void {
        ids.current.forEach((id) => window.clearTimeout(id));
        ids.current.clear();
      },
    }),
    [],
  );
  useEffect(() => timers.clear, [timers]);
  return timers;
}
