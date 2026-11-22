export interface RhythmScore {
  status: 'ok' | 'missing' | 'extra' | 'uneven';
  expected: number;
  heard: number;
  /** Median delay of the player behind the click (includes the microphone's detection delay). Ignored in the grade. */
  offsetMs: number;
  /** Largest deviation from the steady offset. */
  maxDevMs: number;
  /** Per-note deviation from the steady offset (negative = early). */
  devsMs: number[];
  /** How far off still counts as in time. */
  windowMs: number;
}

const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};

/**
 * Grade a rhythm attempt. Timing is judged relative to the player's own steady delay: a microphone
 * adds ~100-200 ms of detection delay, which would otherwise make everyone look late. What matters is
 * that the notes are evenly placed against the click.
 *
 * @param expectedMs when each note should sound (performance.now() timeline)
 * @param playedMs   when key presses were detected
 * @param spbMs      milliseconds per beat
 * @param minGapBeats shortest distance between two notes, in beats (tightens the window for eighth notes)
 */
export function scoreRhythm(expectedMs: number[], playedMs: number[], spbMs: number, minGapBeats: number): RhythmScore {
  const first = expectedMs[0];
  const last = expectedMs[expectedMs.length - 1];
  const played = playedMs.filter((t) => t >= first - 0.5 * spbMs && t <= last + 1.2 * spbMs).sort((a, b) => a - b);
  const windowMs = Math.max(120, Math.min(0.3 * spbMs, 0.4 * minGapBeats * spbMs));
  const base = { expected: expectedMs.length, heard: played.length, windowMs };

  if (played.length < expectedMs.length) return { ...base, status: 'missing', offsetMs: 0, maxDevMs: 0, devsMs: [] };
  if (played.length > expectedMs.length) return { ...base, status: 'extra', offsetMs: 0, maxDevMs: 0, devsMs: [] };

  const errors = played.map((t, i) => t - expectedMs[i]);
  const offsetMs = median(errors);
  const devsMs = errors.map((e) => e - offsetMs);
  const maxDevMs = Math.max(...devsMs.map(Math.abs));
  return { ...base, status: maxDevMs <= windowMs ? 'ok' : 'uneven', offsetMs, maxDevMs, devsMs };
}
