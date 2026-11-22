/** Root-mean-square level of a block of samples (0..1). */
export function rms(buf: Float32Array): number {
  let sum = 0;
  for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
  return Math.sqrt(sum / buf.length);
}

/**
 * Monophonic pitch detection with the YIN algorithm.
 * Returns the fundamental in Hz, or null if there is no clear pitch.
 * One note at a time: chords and noise will give null or garbage.
 */
export function detectPitch(
  buf: Float32Array,
  sampleRate: number,
  minHz = 60,
  maxHz = 1200,
  threshold = 0.15,
): number | null {
  const maxLag = Math.min(Math.floor(sampleRate / minHz), buf.length >> 1);
  const minLag = Math.max(2, Math.floor(sampleRate / maxHz));
  const window = buf.length - maxLag;

  // Difference function.
  const diff = new Float32Array(maxLag + 1);
  for (let tau = 1; tau <= maxLag; tau++) {
    let sum = 0;
    for (let i = 0; i < window; i++) {
      const d = buf[i] - buf[i + tau];
      sum += d * d;
    }
    diff[tau] = sum;
  }

  // Cumulative mean normalised difference.
  const cmnd = new Float32Array(maxLag + 1);
  cmnd[0] = 1;
  let running = 0;
  for (let tau = 1; tau <= maxLag; tau++) {
    running += diff[tau];
    cmnd[tau] = running === 0 ? 1 : (diff[tau] * tau) / running;
  }

  // First dip below the threshold, followed down to its local minimum.
  let tau = minLag;
  while (tau < maxLag) {
    if (cmnd[tau] < threshold) {
      while (tau + 1 < maxLag && cmnd[tau + 1] < cmnd[tau]) tau++;
      // Parabolic interpolation for sub-sample accuracy.
      const a = cmnd[tau - 1];
      const b = cmnd[tau];
      const c = cmnd[tau + 1];
      const denom = a - 2 * b + c;
      const shift = denom === 0 ? 0 : (a - c) / (2 * denom);
      return sampleRate / (tau + shift);
    }
    tau++;
  }
  return null;
}

/** Frequency -> nearest MIDI note and how many cents off it is (-50..+50). */
export function frequencyToNote(freq: number): { midi: number; cents: number } {
  const exact = 69 + 12 * Math.log2(freq / 440);
  const midi = Math.round(exact);
  return { midi, cents: Math.round((exact - midi) * 100) };
}
