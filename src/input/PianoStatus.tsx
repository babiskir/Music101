import { midiToName } from '../domain/notes';
import { usePiano } from './PianoInput';

/** Small keyboard indicator at the right end of the menu bar. Click it for the microphone & input settings. */
export function PianoStatus({ onOpenSettings }: { onOpenSettings: () => void }) {
  const piano = usePiano();
  const connecting = piano.mic.state.status === 'requesting';

  if (piano.connected) {
    return (
      <button className="piano-status ok" onClick={onOpenSettings} title={`Listening to: ${piano.deviceName ?? 'keyboard'}`}>
        <span className="dot-on" aria-hidden="true" /> Keyboard{' '}
        {piano.lastNote ? <>♪ <strong>{midiToName(piano.lastNote.midi)}</strong></> : 'ready'}
      </button>
    );
  }
  if (connecting) return <span className="piano-status">Connecting…</span>;
  return (
    <button className="piano-status warn" onClick={() => void piano.connect()} title="Click to connect your keyboard">
      <span className="dot-off" aria-hidden="true" /> No keyboard: connect
    </button>
  );
}
