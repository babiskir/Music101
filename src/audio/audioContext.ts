let ctx: AudioContext | null = null;

/** Lazily created; browsers only allow audio after a user gesture, so call from a click handler. */
export function getAudioContext(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}
