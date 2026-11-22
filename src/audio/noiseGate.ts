/**
 * Noise gate as an AudioWorklet (sample-accurate, so note attacks aren't chopped).
 * Below the threshold the signal is faded to silence; once a note is playing the gate stays open
 * until the sound has fallen well under the threshold (hysteresis), so note tails survive.
 */
export const NOISE_GATE_SOURCE = `
class NoiseGate extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    return [
      { name: 'threshold', defaultValue: -50, minValue: -100, maxValue: 0 }, // dB
      { name: 'enabled', defaultValue: 0, minValue: 0, maxValue: 1 },
    ];
  }
  constructor() {
    super();
    this.env = 0;
    this.gain = 1;
    this.open = true;
    this.decay = Math.exp(-1 / (0.05 * sampleRate));   // envelope follower, 50 ms
    this.attack = 1 - Math.exp(-1 / (0.002 * sampleRate)); // open in ~2 ms
    this.release = 1 - Math.exp(-1 / (0.12 * sampleRate)); // close over ~120 ms
  }
  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];
    if (!input || input.length === 0) return true;
    const openAt = Math.pow(10, parameters.threshold[0] / 20);
    const closeAt = openAt * 0.6; // hysteresis
    const enabled = parameters.enabled[0] > 0.5;
    const frames = input[0].length;
    for (let i = 0; i < frames; i++) {
      let peak = 0;
      for (let c = 0; c < input.length; c++) peak = Math.max(peak, Math.abs(input[c][i]));
      this.env = Math.max(peak, this.env * this.decay);
      if (this.open && this.env < closeAt) this.open = false;
      else if (!this.open && this.env > openAt) this.open = true;
      const target = !enabled || this.open ? 1 : 0;
      this.gain += (target - this.gain) * (target > this.gain ? this.attack : this.release);
      for (let c = 0; c < output.length; c++) {
        output[c][i] = (input[c] ?? input[0])[i] * this.gain;
      }
    }
    return true;
  }
}
registerProcessor('noise-gate', NoiseGate);
`;

const loaded = new WeakMap<BaseAudioContext, Promise<void>>();

/** Registers the worklet once per AudioContext. Rejects if the browser refuses worklets. */
export function loadNoiseGate(ctx: AudioContext): Promise<void> {
  let p = loaded.get(ctx);
  if (!p) {
    const url = URL.createObjectURL(new Blob([NOISE_GATE_SOURCE], { type: 'text/javascript' }));
    p = ctx.audioWorklet.addModule(url).finally(() => URL.revokeObjectURL(url));
    loaded.set(ctx, p);
  }
  return p;
}
