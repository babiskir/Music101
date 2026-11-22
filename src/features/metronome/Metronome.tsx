import { useRef, useState } from 'react';
import { numberBetween } from '../../lib/storage';
import { usePersistentState } from '../../lib/usePersistentState';
import { useMetronomeEngine } from './useMetronomeEngine';

const MIN_BPM = 30;
const MAX_BPM = 220;

export function Metronome() {
  const [bpm, setBpm] = usePersistentState('metronome.bpm', 80, numberBetween(MIN_BPM, MAX_BPM));
  const [beatsPerBar, setBeatsPerBar] = usePersistentState('metronome.beats', 4, numberBetween(2, 6));
  const [currentBeat, setCurrentBeat] = useState<number | null>(null);
  const taps = useRef<number[]>([]);

  const { running, start, stop } = useMetronomeEngine({
    bpm,
    beatsPerBar,
    onTick: (tick) => setCurrentBeat(tick.beat % beatsPerBar),
  });

  const toggle = () => {
    if (running) {
      stop();
      setCurrentBeat(null);
    } else {
      start();
    }
  };

  const clampBpm = (v: number) => Math.min(MAX_BPM, Math.max(MIN_BPM, Math.round(v)));

  const tapTempo = () => {
    const now = performance.now();
    const recent = taps.current.filter((t) => now - t < 2500);
    recent.push(now);
    taps.current = recent;
    if (recent.length >= 2) {
      const avgMs = (recent[recent.length - 1] - recent[0]) / (recent.length - 1);
      setBpm(clampBpm(60000 / avgMs));
    }
  };

  return (
    <section className="card">
      <h2>Metronome</h2>
      <div className="beat-dots" aria-label="Current beat">
        {Array.from({ length: beatsPerBar }, (_, i) => (
          <span
            key={i}
            className={`dot${currentBeat === i ? ' on' : ''}${i === 0 ? ' downbeat' : ''}`}
          />
        ))}
      </div>

      <div className="bpm-row">
        <button onClick={() => setBpm((b) => clampBpm(b - 1))} aria-label="Slower">−</button>
        <div className="bpm-value">
          <strong>{bpm}</strong> BPM
        </div>
        <button onClick={() => setBpm((b) => clampBpm(b + 1))} aria-label="Faster">+</button>
      </div>
      <input
        type="range"
        min={MIN_BPM}
        max={MAX_BPM}
        value={bpm}
        onChange={(e) => setBpm(Number(e.target.value))}
        aria-label="Tempo"
      />

      <div className="row">
        <label>
          Beats per bar{' '}
          <select value={beatsPerBar} onChange={(e) => setBeatsPerBar(Number(e.target.value))}>
            {[2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </label>
        <button onClick={tapTempo}>Tap tempo</button>
        <button className="primary" onClick={toggle}>{running ? 'Stop' : 'Start'}</button>
      </div>
    </section>
  );
}
