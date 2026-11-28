/**
 * Small seeded random numbers (mulberry32), kept as a plain number so a run's state stays a plain
 * value: the same seed always gives the same run (the daily run is the same for everyone that day).
 */
export function nextRandom(state: number): [value: number, state: number] {
  const s = (state + 0x6d2b79f5) | 0;
  let t = s;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, s];
}

/** Pick `count` different items (fewer if the list is shorter), in random order. */
export function sample<T>(items: readonly T[], count: number, state: number): [T[], number] {
  const rest = [...items];
  const out: T[] = [];
  let s = state;
  while (out.length < count && rest.length) {
    const [r, s2] = nextRandom(s);
    s = s2;
    out.push(rest.splice(Math.floor(r * rest.length), 1)[0]);
  }
  return [out, s];
}

/** Today's date as 2026-11-28 (local time). */
export function todayKey(d = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** A seed from any text (FNV-1a). */
export function seedFrom(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 0x01000193);
  return h | 0;
}

export const randomSeed = (): number => (Math.random() * 2 ** 32) | 0;
