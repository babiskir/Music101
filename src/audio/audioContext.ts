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
