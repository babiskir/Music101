import { useCallback, useState, type SetStateAction } from 'react';
import { storage, type Validator } from './storage';

/**
 * Like useState, but remembered between visits. The saved value is only written when you change it
 * (so new defaults in a later version still apply to people who never touched the setting), and a
 * saved value that fails `validate` is ignored.
 */
export function usePersistentState<T>(key: string, initial: T, validate?: Validator<T>) {
  const [value, setValue] = useState<T>(() => storage.get(key, initial, validate));

  const set = useCallback(
    (action: SetStateAction<T>) => {
      setValue((prev) => {
        const next = typeof action === 'function' ? (action as (p: T) => T)(prev) : action;
        storage.set(key, next);
        return next;
      });
    },
    [key],
  );

  return [value, set] as const;
}
