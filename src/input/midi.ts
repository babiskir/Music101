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
  onError?: (message: string) => void,
): Promise<MidiConnection> {
  if (!('requestMIDIAccess' in navigator)) {
    throw new Error('This browser does not support Web MIDI. Use Edge or Chrome.');
  }
  const access = await navigator.requestMIDIAccess();

  // A keyboard that switched itself off (Auto Power Off) can stay in the list as "disconnected": it must
  // not count as connected. When it is switched on again, the browser reports a state change and we
  // listen to it again.
  const attach = () => {
    const names: string[] = [];
    access.inputs.forEach((input) => {
      if (input.state === 'disconnected') {
        input.onmidimessage = null;
        return;
      }
      input.onmidimessage = (e) => {
        const note = parseNoteOn(e.data);
        if (note) onNote(note);
      };
      // On Windows only one program can use a MIDI port at a time. If another program (or another tab of
      // this app) has it, opening fails and no notes would ever arrive: say so instead of staying silent.
      input.open?.()?.catch(() =>
        onError?.(
          `The keyboard "${input.name ?? 'MIDI input'}" is in use by another program or browser tab. Close the other one, then click the keyboard indicator to connect again.`,
        ),
      );
      names.push(input.name ?? 'MIDI input');
    });
    onInputs(names);
  };
  attach();
  access.onstatechange = attach; // hot-plug and wake-up

  return {
    dispose() {
      access.inputs.forEach((input) => (input.onmidimessage = null));
      access.onstatechange = null;
      onInputs([]);
    },
  };
}
