import { useCallback, useState } from 'react';

const KEY = 'music101.done';

function load(): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
  } catch {
    return [];
  }
}

/** Which lessons the user ticked as done (stored in this browser only). */
export function useProgress() {
  const [done, setDone] = useState<string[]>(load);

  const toggle = useCallback((id: string) => {
    setDone((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* storage unavailable: progress just won't persist */
      }
      return next;
    });
  }, []);

  return { done, toggle };
}
