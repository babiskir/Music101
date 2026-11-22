import { describe, expect, it } from 'vitest';
import { createNoteTracker } from './noteTracker';
import { parseNoteOn } from './midi';

type Frame = [db: number, midi: number | null];

/** Feed 50 ms frames to a fresh tracker and return the key presses it reports. */
function play(frames: Frame[]): number[] {
  const tracker = createNoteTracker();
  const out: number[] = [];
  frames.forEach(([db, midi], i) => {
    const n = tracker.push(db, midi, i * 50);
    if (n !== null) out.push(n);
  });
  return out;
}

const silence = (n: number): Frame[] => Array.from({ length: n }, () => [-70, null]);
/** A piano note: fast attack, then it fades about 1.5 dB per frame. */
const note = (midi: number, frames = 8, startDb = -20): Frame[] =>
  Array.from({ length: frames }, (_, i) => [startDb - 1.5 * i - (i === 0 ? 12 : i === 1 ? 5 : 0), midi]);

describe('noteTracker', () => {
  it('reports each note after silence', () => {
    const frames = [...silence(2), ...note(64), ...silence(2), ...note(64), ...silence(2), ...note(65), ...silence(2), ...note(67)];
    expect(play(frames)).toEqual([64, 64, 65, 67]);
  });

  it('reports a repeated note with no gap (E E)', () => {
    const frames = [...silence(2), ...note(64, 10), ...note(64, 10), ...note(65, 10), ...note(67, 10)];
    expect(play(frames)).toEqual([64, 64, 65, 67]);
  });

  it('does not retrigger a single held, fading note', () => {
    expect(play([...silence(2), ...note(64, 30)])).toEqual([64]);
  });

  it('does not retrigger when the pitch detection drops out mid-note', () => {
    const dbs = [-70, -70, -32, -25, -20, -21.5, -23, -24.5, -26, -27.5, -29, -30.5, -32, -33.5, -35, -36.5];
    const frames: Frame[] = dbs.map((db, i) => [db, db < -45 || (i >= 8 && i <= 10) ? null : 64]);
    expect(play(frames)).toEqual([64]);
  });
});

describe('parseNoteOn', () => {
  it('reads note-on messages on any channel', () => {
    expect(parseNoteOn([0x90, 60, 100])).toEqual({ midi: 60, velocity: 100 });
    expect(parseNoteOn([0x92, 64, 80])).toEqual({ midi: 64, velocity: 80 });
  });
  it('ignores note-off (also as velocity 0), clock and short messages', () => {
    expect(parseNoteOn([0x90, 60, 0])).toBeNull();
    expect(parseNoteOn([0x80, 60, 64])).toBeNull();
    expect(parseNoteOn([0xf8])).toBeNull();
    expect(parseNoteOn(null)).toBeNull();
  });
});
