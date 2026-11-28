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

/**
 * A saved table of records by id ("stats", "games.best"…). Entries that fail `isValue` (old or broken
 * data) are left out. Each write reads the table again first, so two parts of the app never undo each other.
 */
export function storedTable<V>(key: string, isValue: Validator<V>) {
  const all = (): Record<string, V> => {
    const raw = storage.get<unknown>(key, {});
    if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return {};
    return Object.fromEntries(Object.entries(raw).filter(([, v]) => isValue(v))) as Record<string, V>;
  };
  return {
    all,
    get: (id: string): V | undefined => all()[id],
    set(id: string, value: V): void {
      storage.set(key, { ...all(), [id]: value });
    },
  };
}

/** Validator for an object whose listed fields are all numbers. */
export const numberFields = <T>(...fields: (keyof T & string)[]): Validator<T> =>
  (v): v is T => typeof v === 'object' && v !== null && fields.every((f) => typeof (v as Record<string, unknown>)[f] === 'number');

/** Validator for a fixed set of string options. */
export function oneOf<T extends string>(...options: readonly T[]): Validator<T> {
  return (v): v is T => typeof v === 'string' && (options as readonly string[]).includes(v);
}

/** Validator for a number inside [min, max]. */
export function numberBetween(min: number, max: number): Validator<number> {
  return (v): v is number => typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
}

export const isBoolean: Validator<boolean> = (v): v is boolean => typeof v === 'boolean';
