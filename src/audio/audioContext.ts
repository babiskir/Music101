import { createSignal } from '../lib/signal';

let ctx: AudioContext | null = null;

/** Lazily created; browsers only allow audio after a user gesture, so call from a click handler. */
export function getAudioContext(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

/** The context if it exists already (never creates one). */
export function peekAudioContext(): AudioContext | null {
  return ctx;
}

// Browsers keep audio muted until the page got a click or key press; resume as soon as it happens.
if (typeof document !== 'undefined') {
  const resume = () => {
    if (ctx && ctx.state === 'suspended') void ctx.resume();
  };
  document.addEventListener('pointerdown', resume, { capture: true });
  document.addEventListener('keydown', resume, { capture: true });
}

// ---------- one output for everything the app plays, so it can all be silenced at once ----------

let bus: GainNode | null = null;

/**
 * Connect app sounds (clicks, demo notes, cues) here instead of ctx.destination. Notes are often
 * scheduled ahead on the audio clock; once queued they cannot be called back one by one, but cutting
 * this output silences all of them.
 */
export function getOutput(): AudioNode {
  const c = getAudioContext();
  if (!bus) {
    bus = c.createGain();
    bus.connect(c.destination);
  }
  return bus;
}

const stopped = createSignal();

/** Called whenever stopAllSound runs: anything that keeps scheduling sound (metronomes, loops) should halt. */
export const onStopAll = stopped.subscribe;

/** Silence everything now: queued notes and clicks, running metronomes, spoken instructions. */
export function stopAllSound(): void {
  if (bus && ctx) {
    const old = bus;
    bus = null; // new sounds go to a fresh output
    old.gain.setTargetAtTime(0, ctx.currentTime, 0.008); // quick fade, no click
    window.setTimeout(() => old.disconnect(), 80);
  }
  if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
  stopped.emit();
}
