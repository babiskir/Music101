import { usePiano } from '../../input/PianoInput';
import type { PageProps } from '../types';

/** Layout: short sections, each answering one question. */
export function HelpPage({ openPage }: PageProps) {
  const piano = usePiano();

  return (
    <section className="card help">
      <h2>Help <small>connecting your keyboard</small></h2>

      <h3>Two ways to connect your CT-S100</h3>
      <ul>
        <li>
          <strong>USB (MIDI)</strong>: plug the piano's USB port into the PC and choose{' '}
          <em>Keyboard → Connect: USB (MIDI)</em>. Exact notes, and the piano keeps its own sound.
        </li>
        <li>
          <strong>Cable / microphone</strong>: the piano's output into the PC's mic jack (or a microphone near the
          piano), then <em>Keyboard → Connect: cable / microphone</em>. The app detects one note at a time.
        </li>
      </ul>
      <div className="row">
        <button className="primary" onClick={() => void piano.connectMic()} disabled={piano.connected}>
          Connect: cable / microphone
        </button>
        <button onClick={() => void piano.connectMidi()} disabled={piano.connected}>Connect: USB (MIDI)</button>
        <button onClick={() => openPage('mic-settings')}>Microphone &amp; input settings…</button>
      </div>

      <h3>If the piano goes silent when the cable is plugged in</h3>
      <p>
        Plugging into the piano's output jack mutes its speakers; that's how the jack works. Open{' '}
        <button className="link" onClick={() => openPage('mic-settings')}>Microphone &amp; input settings</button> and
        tick <strong>Hear it</strong> to play the sound through your PC speakers or headphones.
      </p>

      <h3>If the app doesn't hear you</h3>
      <ul>
        <li>Check the input in the microphone settings. "Stereo Mix" records the PC's own sound, not a microphone.</li>
        <li>Turn the piano volume down to about half if the page says the signal is clipping.</li>
        <li>Play one note at a time; the microphone path can't read chords.</li>
        <li>Use <strong>Auto-set</strong> for the noise gate if you hear hiss between notes.</li>
      </ul>

      <h3>Your data</h3>
      <p>
        Progress and settings are stored in this browser only (nothing is uploaded or recorded). Use{' '}
        <em>Settings → Reset saved progress and settings…</em> to clear them.
      </p>
    </section>
  );
}
