import { classifyInput, inputHint } from '../../audio/micDevices';
import { usePiano } from '../../input/PianoInput';
import { CT_S100 } from '../../domain/instrument';
import { midiToPitch } from '../../domain/notes';
import { Keyboard, type KeyHighlight } from '../../features/keyboard/Keyboard';

const SOUND_GATE_DB = -45;

/** Layout: status + meter on top, big detected note, live keyboard, device picker. */
export function MicSettings() {
  const mic = usePiano().mic; // shared with the rest of the app, so it keeps running between lessons
  const { state, devices } = mic;
  const listening = state.status === 'listening';

  const meterPct = Math.max(0, Math.min(100, ((state.db + 60) / 60) * 100));
  const heardSound = listening && state.db > SOUND_GATE_DB;

  const highlights: Record<number, KeyHighlight> = {};
  if (state.note && state.note.midi >= CT_S100.lowest && state.note.midi <= CT_S100.highest) {
    highlights[state.note.midi] = { kind: 'current' };
  }

  return (
    <section className="card">
      <h2>Microphone &amp; input <small>nothing is recorded or sent anywhere</small></h2>

      <div className="row">
        <button className="primary" onClick={() => (listening ? mic.stop() : mic.start())}>
          {listening ? 'Stop listening' : state.status === 'requesting' ? 'Waiting for permission…' : 'Start listening'}
        </button>
        {devices.length > 0 && (
          <label>
            Input{' '}
            <select
              value={state.deviceId ?? ''}
              onChange={(e) => {
                if (!e.target.value) mic.forgetInput(); // "Browser default" = stop remembering a choice
                void mic.start(e.target.value || undefined);
              }}
            >
              <option value="">Browser default</option>
              {devices.map((d, i) => (
                <option key={d.deviceId || i} value={d.deviceId}>{d.label || `Input ${i + 1}`}{inputHint(classifyInput(d.label)) ? ` (${inputHint(classifyInput(d.label))})` : ''}</option>
              ))}
            </select>
          </label>
        )}
      </div>

      {state.status === 'error' && <p className="hint-box error">{state.error}</p>}

      {listening && (
        <>
          <p className="explain">
            Using: <strong>{state.deviceLabel || 'unknown input'}</strong>
          </p>
          {state.switchedFrom && (
            <p className="hint-box">
              Your browser's default input was <strong>{state.switchedFrom}</strong> (
              {inputHint(classifyInput(state.switchedFrom)) || 'not a normal microphone'}), so I switched to a real
              microphone. You can still pick any input below.
            </p>
          )}
          {classifyInput(state.deviceLabel ?? '') === 'loopback' && (
            <p className="hint-box error">
              This input records what the PC <em>plays</em> (your earphones), not what a microphone hears. Pick your
              microphone in the Input list.
            </p>
          )}
          <div className="row monitor">
            <label>
              <input
                type="checkbox"
                checked={mic.monitor.on}
                onChange={(e) => mic.setHearIt(e.target.checked)}
              />{' '}
              <strong>Hear it</strong> through the PC speakers / headphones
            </label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={mic.monitor.volume}
              disabled={!mic.monitor.on}
              onChange={(e) => mic.setVolume(Number(e.target.value))}
              aria-label="Monitor volume"
            />
          </div>
          <p className="muted">
            For the cable from the piano's output jack (which mutes the piano's own speakers). Don't use it with a
            real microphone and speakers: they would howl. A short delay is normal.
          </p>
          <div className="row monitor">
            <label>
              <input
                type="checkbox"
                checked={mic.cleanup.gate}
                onChange={(e) => mic.setCleanup((c) => ({ ...c, gate: e.target.checked }))}
              />{' '}
              <strong>Noise gate</strong> (silences hiss between notes)
            </label>
            <input
              type="range"
              min={-80}
              max={-20}
              value={mic.cleanup.thresholdDb}
              disabled={!mic.cleanup.gate}
              onChange={(e) => mic.setCleanup((c) => ({ ...c, thresholdDb: Number(e.target.value) }))}
              aria-label="Noise gate threshold"
            />
            <span className="muted">{mic.cleanup.thresholdDb} dB</span>
            <button onClick={mic.calibrate} disabled={mic.calibrating}>
              {mic.calibrating ? "Listening to the noise… don't play" : "Auto-set (don't play for 2 s)"}
            </button>
          </div>
          <div className="row monitor">
            <label>
              <input
                type="checkbox"
                checked={mic.cleanup.hum}
                onChange={(e) => mic.setCleanup((c) => ({ ...c, hum: e.target.checked }))}
              />{' '}
              <strong>Hum filter</strong> (removes 50 Hz mains hum and low rumble)
            </label>
          </div>
          <div className="meter" role="meter" aria-valuemin={-60} aria-valuemax={0} aria-valuenow={Math.round(state.db)}>
            <div className={`meter-fill${heardSound ? ' hot' : ''}`} style={{ width: `${meterPct}%` }} />
            {mic.cleanup.gate && (
              <div
                className="meter-threshold"
                title="Noise gate threshold"
                style={{ left: `${Math.max(0, Math.min(100, ((mic.cleanup.thresholdDb + 60) / 60) * 100))}%` }}
              />
            )}
          </div>
          <p className="muted">
            Level {state.db <= -100 ? '-∞' : state.db.toFixed(0)} dB · peak {state.peakDb.toFixed(0)} dB ·{' '}
            {heardSound ? 'hearing sound' : 'silence — clap, talk or play a key'}
          </p>
          {state.peakDb > -3 && (
            <p className="hint-box error">
              The signal is hitting the maximum (clipping): too loud for this input. Turn the CT-S100 volume down to
              about half, and in Windows Sound settings lower the input level / set Microphone Boost to 0 dB. Clipped
              sound makes note detection less reliable.
            </p>
          )}
          {!heardSound && state.peakDb < -60 && (
            <p className="hint-box">
              Still completely silent? Try another entry in the Input list. Headsets often show up twice, and a virtual
              device (e.g. Oculus) won't carry your real microphone.
            </p>
          )}

          <p className="prompt note-readout">
            {state.note ? (
              <>
                I hear <strong>{midiToPitch(state.note.midi)}</strong>
                <span className="muted cents">
                  {' '}{state.note.freq.toFixed(1)} Hz · {state.note.cents > 0 ? '+' : ''}{state.note.cents} cents
                </span>
              </>
            ) : (
              <span className="muted">Play one note at a time on the CT-S100 (or hum one).</span>
            )}
          </p>
          <Keyboard from={CT_S100.lowest} to={CT_S100.highest} highlights={highlights} />
          <p className="muted">
            Works best with a single note, at a medium volume, with the mic near the keyboard speaker. Chords and
            noisy rooms confuse it. This is the groundwork for "the app listens while you play".
          </p>
        </>
      )}
    </section>
  );
}
