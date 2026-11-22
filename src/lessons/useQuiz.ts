import { useCallback, useEffect, useRef, useState } from 'react';

export interface QuizResult<D> {
  ok: boolean;
  /** Whatever the lesson wants to remember about the answer (e.g. the key clicked). */
  detail: D;
}

const ADVANCE_MS = 900;

/**
 * Shared "ask a question, check the answer, keep score" loop used by the exercises.
 * `pick` creates the next target; a right answer auto-advances after a short pause.
 */
export function useQuiz<T, D = undefined>(pick: (prev: T | null) => T) {
  const pickRef = useRef(pick);
  pickRef.current = pick;

  const [target, setTarget] = useState<T>(() => pick(null));
  const [result, setResult] = useState<QuizResult<D> | null>(null);
  const [score, setScore] = useState({ right: 0, tries: 0 });
  const timer = useRef<number | null>(null);
  const locked = useRef(false);

  const clearTimer = () => {
    if (timer.current !== null) window.clearTimeout(timer.current);
    timer.current = null;
  };
  useEffect(() => clearTimer, []);

  const advance = useCallback(() => {
    clearTimer();
    locked.current = false;
    setTarget((t) => pickRef.current(t));
    setResult(null);
  }, []);

  const answer = useCallback(
    (ok: boolean, detail: D) => {
      if (locked.current) return;
      setResult({ ok, detail });
      setScore((s) => ({ right: s.right + (ok ? 1 : 0), tries: s.tries + 1 }));
      if (ok) {
        locked.current = true;
        timer.current = window.setTimeout(advance, ADVANCE_MS);
      }
    },
    [advance],
  );

  const resetScore = useCallback(() => setScore({ right: 0, tries: 0 }), []);

  return { target, result, score, answer, restart: advance, resetScore };
}
