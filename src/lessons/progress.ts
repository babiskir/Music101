import { useCallback, useState } from 'react';
import { storage } from '../lib/storage';

const isStringArray = (v: unknown): v is string[] => Array.isArray(v) && v.every((x) => typeof x === 'string');

/** Which lessons the user ticked as done (stored in this browser only). */
export function useProgress() {
  const [done, setDone] = useState<string[]>(() => storage.get('done', [], isStringArray));

  const toggle = useCallback((id: string) => {
    setDone((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      storage.set('done', next);
      return next;
    });
  }, []);

  /** Mark as done (no-op if already). */
  const markDone = useCallback((id: string) => {
    setDone((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      storage.set('done', next);
      return next;
    });
  }, []);

  return { done, toggle, markDone };
}
