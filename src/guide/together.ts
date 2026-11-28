/** Over USB, keys count as "together" when they all land within this much time of each other. */
export const TOGETHER_MS = 400;

export type TogetherResult = 'wrong' | 'partial' | 'complete';

/**
 * Judges a target of several keys played at once (both hands). Each press is checked against the keys;
 * the target is complete once every key was pressed within `windowMs` of the latest press. With the
 * microphone (it hears one note at a time) or the mouse, pass Infinity: the keys may come one by one.
 */
export class TogetherJudge {
  private hits = new Map<number, number>();

  constructor(readonly keys: number[]) {}

  press(midi: number, timeMs: number, windowMs: number): TogetherResult {
    if (!this.keys.includes(midi)) {
      this.hits.clear();
      return 'wrong';
    }
    this.hits.set(midi, timeMs);
    for (const [key, at] of this.hits) if (timeMs - at > windowMs) this.hits.delete(key);
    if (this.keys.every((k) => this.hits.has(k))) {
      this.hits.clear();
      return 'complete';
    }
    return 'partial';
  }

  /** Keys already pressed for the current attempt. */
  get found(): number[] {
    return [...this.hits.keys()];
  }
}
