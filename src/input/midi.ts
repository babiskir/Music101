/** Parse a raw MIDI message. Returns the note for a "note on" with velocity > 0, else null. */
export function parseNoteOn(data: ArrayLike<number> | null | undefined): { midi: number; velocity: number } | null {
  if (!data || data.length < 3) return null;
  const status = data[0] & 0xf0;
  const velocity = data[2];
  if (status === 0x90 && velocity > 0) return { midi: data[1], velocity };
  return null; // note-off (0x80, or 0x90 with velocity 0), clock, pedal, ...
}

export interface MidiConnection {
  dispose(): void;
}

/**
 * Listen to every MIDI input (the CT-S100 shows up as "CASIO USB-MIDI" when plugged in with USB).
 * `onInputs` is called with the current input names, and again when something is plugged/unplugged.
 */
export async function connectMidi(
  onNote: (note: { midi: number; velocity: number }) => void,
  onInputs: (names: string[]) => void,
): Promise<MidiConnection> {
  if (!('requestMIDIAccess' in navigator)) {
    throw new Error('This browser does not support Web MIDI. Use Edge or Chrome.');
  }
  const access = await navigator.requestMIDIAccess();

  const attach = () => {
    const names: string[] = [];
    access.inputs.forEach((input) => {
      input.onmidimessage = (e) => {
        const note = parseNoteOn(e.data);
        if (note) onNote(note);
      };
      names.push(input.name ?? 'MIDI input');
    });
    onInputs(names);
  };
  attach();
  access.onstatechange = attach; // hot-plug

  return {
    dispose() {
      access.inputs.forEach((input) => (input.onmidimessage = null));
      access.onstatechange = null;
      onInputs([]);
    },
  };
}
