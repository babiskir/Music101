import { afterEach, describe, expect, it, vi } from 'vitest';
import { connectMidi } from './midi';

/** A fake Web MIDI access with one keyboard that can be switched off and on. */
function fakeAccess() {
  const port = {
    name: 'CASIO USB-MIDI',
    state: 'connected' as 'connected' | 'disconnected',
    onmidimessage: null as null | ((e: { data: number[] }) => void),
  };
  const inputs = new Map([['casio', port]]);
  const access = { inputs, onstatechange: null as null | (() => void) };
  const setState = (state: 'connected' | 'disconnected') => {
    port.state = state;
    access.onstatechange?.();
  };
  return { port, access, setState };
}

afterEach(() => vi.unstubAllGlobals());

describe('keyboard that switches itself off and on', () => {
  it('is reported as gone while asleep, and found again (with notes flowing) when switched on', async () => {
    const { port, access, setState } = fakeAccess();
    vi.stubGlobal('navigator', { requestMIDIAccess: async () => access });
    const names: string[][] = [];
    const notes: number[] = [];
    await connectMidi((n) => notes.push(n.midi), (n) => names.push(n));

    expect(names.at(-1)).toEqual(['CASIO USB-MIDI']);
    port.onmidimessage?.({ data: [0x90, 60, 90] });
    expect(notes).toEqual([60]);

    setState('disconnected'); // Auto Power Off
    expect(names.at(-1)).toEqual([]);
    expect(port.onmidimessage).toBeNull();

    setState('connected'); // switched on again
    expect(names.at(-1)).toEqual(['CASIO USB-MIDI']);
    port.onmidimessage?.({ data: [0x90, 62, 90] });
    expect(notes).toEqual([60, 62]);
  });

  it('says clearly when the browser has no Web MIDI', async () => {
    vi.stubGlobal('navigator', {});
    await expect(connectMidi(() => {}, () => {})).rejects.toThrow(/Web MIDI/);
  });
});
