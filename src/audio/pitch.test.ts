import { describe, expect, it } from 'vitest';
import { midiToName, midiToPitch, pitchToMidi } from '../domain/notes';
import { detectPitch, frequencyToNote, rms } from './pitch';

const SR = 48000;
const tone = (freq: number) =>
  Float32Array.from({ length: 4096 }, (_, i) => {
    const t = i / SR;
    return 0.3 * Math.sin(2 * Math.PI * freq * t) + 0.15 * Math.sin(4 * Math.PI * freq * t);
  });

describe('pitch detection', () => {
  it.each(['C2', 'C4', 'E4', 'A4', 'C6'])('recognises %s', (pitch) => {
    const midi = pitchToMidi(pitch);
    const f = 440 * 2 ** ((midi - 69) / 12);
    const found = detectPitch(tone(f), SR);
    expect(found).not.toBeNull();
    expect(frequencyToNote(found!).midi).toBe(midi);
  });

  it('hears nothing in silence or noise', () => {
    expect(detectPitch(new Float32Array(4096), SR)).toBeNull();
    expect(rms(new Float32Array(4096))).toBe(0);
    const noise = Float32Array.from({ length: 4096 }, (_, i) => Math.sin(i * i * 0.37) * 0.2);
    expect(detectPitch(noise, SR)).toBeNull();
  });
});

describe('note names', () => {
  it('converts between pitch, MIDI and letter names', () => {
    expect(pitchToMidi('C4')).toBe(60);
    expect(midiToPitch(61)).toBe('C#4');
    expect(midiToName(66)).toBe('F#');
  });
});
