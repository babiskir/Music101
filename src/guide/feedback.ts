import { useSyncExternalStore } from 'react';
import { getAudioContext } from '../audio/audioContext';
import { isBoolean, storage } from '../lib/storage';

// ---------- sound cues: you should be able to keep your eyes on the keys ----------

let lastCueAt = -Infinity;

/** True for a moment after a cue or speech, so the app doesn't "hear" its own sound through a microphone. */
export function isCueActive(): boolean {
  const speaking = typeof speechSynthesis !== 'undefined' && speechSynthesis.speaking;
  return speaking || performance.now() - lastCueAt < 350;
}

function blip(freq: number, start: number, duration: number, type: OscillatorType, gain: number) {
  const ctx = getAudioContext();
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, start);
  g.gain.exponentialRampToValueAtTime(gain, start + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(g).connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

/** ok = right note · done = step finished · wrong = not that one. */
export function cue(kind: 'ok' | 'done' | 'wrong'): void {
  const t = getAudioContext().currentTime;
  lastCueAt = performance.now();
  if (kind === 'ok') blip(988, t, 0.12, 'sine', 0.1);
  else if (kind === 'done') [784, 988, 1175].forEach((f, i) => blip(f, t + i * 0.09, 0.16, 'sine', 0.1));
  else blip(165, t, 0.2, 'triangle', 0.12);
}

// ---------- optional spoken instructions ----------

let speakOn = storage.get('guide.speak', false, isBoolean);
const listeners = new Set<() => void>();

export function setSpeak(on: boolean): void {
  speakOn = on;
  storage.set('guide.speak', on);
  if (!on && typeof speechSynthesis !== 'undefined') speechSynthesis.cancel();
  listeners.forEach((l) => l());
}

export function useSpeak(): boolean {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => { listeners.delete(cb); };
    },
    () => speakOn,
  );
}

export function speak(text: string): void {
  if (!speakOn || typeof speechSynthesis === 'undefined') return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text.replace(/#/g, ' sharp'));
  u.rate = 0.95;
  speechSynthesis.speak(u);
}
