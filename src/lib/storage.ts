/**
 * Tiny wrapper around localStorage. Everything is namespaced under "music101." and every access is
 * wrapped in try/catch (private windows, blocked storage and full quotas must never break the app).
 */
const PREFIX = 'music101.';

export type Validator<T> = (value: unknown) => value is T;

export const storage = {
  get<T>(key: string, fallback: T, validate?: Validator<T>): T {
    let raw: string | null;
    try {
      raw = localStorage.getItem(PREFIX + key);
    } catch {
      return fallback;
    }
    if (raw === null) return fallback;
    let value: unknown;
    try {
      value = JSON.parse(raw);
    } catch {
      value = raw; // older versions stored plain strings
    }
    if (validate) return validate(value) ? value : fallback;
    return value as T;
  },

  set(key: string, value: unknown): void {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      /* not persisted: the app keeps working */
    }
  },

  /** Forget everything this app saved. */
  clearAll(): void {
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith(PREFIX))
        .forEach((k) => localStorage.removeItem(k));
    } catch {
      /* ignore */
    }
  },
};

/** Validator for a fixed set of string options. */
export function oneOf<T extends string>(...options: readonly T[]): Validator<T> {
  return (v): v is T => typeof v === 'string' && (options as readonly string[]).includes(v);
}

/** Validator for a number inside [min, max]. */
export function numberBetween(min: number, max: number): Validator<number> {
  return (v): v is number => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
}

export const isBoolean: Validator<boolean> = (v): v is boolean => typeof v === 'boolean';
