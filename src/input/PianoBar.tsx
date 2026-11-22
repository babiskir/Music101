import { midiToPitch } from '../domain/notes';
import { usePiano } from './PianoInput';

/** Slim status bar under the header: connect your keyboard once, every lesson then listens to it. */
export function PianoBar({ onOpenMicSettings }: { onOpenMicSettings: () => void }) {
  const piano = usePiano();
  const connecting = piano.mic.state.status === 'requesting';

  return (
    <div className={`piano-bar${piano.connected ? ' connected' : ''}`}>
      <span className="piano-bar-title">🎹 Keyboard</span>

      {!piano.connected && (
        <>
          <span className="muted">{connecting ? 'Connecting…' : 'not connected. Play along with:'}</span>
          <button className="primary" onClick={() => void piano.connectMic()} disabled={connecting}>
            Cable / microphone
          </button>
          <button onClick={() => void piano.connectMidi()}>USB (MIDI)</button>
        </>
      )}

      {piano.connected && (
        <>
          <span>
            {piano.source === 'midi' ? 'USB MIDI' : 'listening through the input'}:{' '}
            <strong>{piano.deviceName || 'connected'}</strong>
          </span>
          <span className="last-note" aria-live="polite">
            {piano.lastNote ? <>♪ <strong>{midiToPitch(piano.lastNote.midi)}</strong></> : 'play a key…'}
          </span>
          {piano.source === 'mic' && <button onClick={onOpenMicSettings}>Mic settings</button>}
          <button onClick={piano.disconnect}>Disconnect</button>
        </>
      )}

      {(piano.error || piano.mic.state.status === 'error') && (
        <span className="piano-bar-error">{piano.error ?? piano.mic.state.error}</span>
      )}
    </div>
  );
}
