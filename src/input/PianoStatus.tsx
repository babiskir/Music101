import { midiToName } from '../domain/notes';
import { usePiano } from './PianoInput';

/** Small keyboard indicator at the right end of the menu bar. Click it for the microphone & input settings. */
export function PianoStatus({ onOpenSettings }: { onOpenSettings: () => void }) {
  const piano = usePiano();
  const connecting = piano.mic.state.status === 'requesting';

  if (piano.connected) {
    return (
      <button className="piano-status ok" onClick={onOpenSettings} title={`Listening to: ${piano.deviceName ?? 'keyboard'}`}>
        <span className="dot-on" aria-hidden="true" /> {piano.source === 'midi' ? 'Keyboard (USB)' : 'Keyboard (mic)'}{' '}
        {piano.lastNote ? <>♪ <strong>{midiToName(piano.lastNote.midi)}</strong></> : 'ready'}
      </button>
    );
  }
  if (connecting) return <span className="piano-status">Connecting…</span>;
  if (piano.lost) {
    return (
      <button className="piano-status warn" onClick={() => void piano.connect()} title="The keyboard disappeared. Switch it on: it reconnects by itself. Or click to try now.">
        <span className="dot-off" aria-hidden="true" /> Keyboard asleep? Switch it on
      </button>
    );
  }
  return (
    <button className="piano-status warn" onClick={() => void piano.connect()} title="Click to connect your keyboard">
      <span className="dot-off" aria-hidden="true" /> No keyboard: connect
    </button>
  );
}
