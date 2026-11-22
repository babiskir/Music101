import { useEffect, useRef, useState } from 'react';
import { getAudioContext } from '../../audio/audioContext';
import { playNote } from '../../audio/sounds';
import type { Finger } from '../../domain/song';
import { Keyboard, type KeyHighlight } from '../../features/keyboard/Keyboard';
import { isBoolean, oneOf } from '../../lib/storage';
import { usePersistentState } from '../../lib/usePersistentState';
import { POSITIONS, type Hand } from './positions';

const DRILLS: { id: string; title: string; fingers: Finger[] }[] = [
  { id: 'up-down', title: 'Up and down', fingers: [1, 2, 3, 4, 5, 4, 3, 2, 1] },
  { id: 'skips', title: 'Skips', fingers: [1, 3, 2, 4, 3, 5, 4, 2] },
  { id: 'leaps', title: 'Thumb to pinky', fingers: [1, 5, 1, 5, 2, 4, 2, 4] },
  { id: 'ode', title: 'Ode to Joy fingers', fingers: [3, 3, 4, 5, 5, 4, 3, 2, 1, 1, 2, 3, 3, 2, 2] },
];

/**
 * Press the keys for a sequence of finger numbers. The sequence is shown as numbers,
 * so you have to translate finger -> key yourself (optional key hint available).
 */
export function FingerDrill({ hand }: { hand: Hand }) {
  const pos = POSITIONS[hand];
  const [drillId, setDrillId] = usePersistentState('drill.id', DRILLS[0].id, oneOf(...DRILLS.map((d) => d.id)));
  const [step, setStep] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [wrongKey, setWrongKey] = useState<number | null>(null);
  const [showHint, setShowHint] = usePersistentState('drill.hint', false, isBoolean);
  const timer = useRef<number | null>(null);
  useEffect(() => () => { if (timer.current) window.clearTimeout(timer.current); }, []);

  const drill = DRILLS.find((d) => d.id === drillId) ?? DRILLS[0];
  const done = step >= drill.fingers.length;

  const restart = (id = drillId) => {
    setDrillId(id);
    setStep(0);
    setMistakes(0);
    setWrongKey(null);
  };

  const press = (midi: number) => {
    playNote(midi, getAudioContext().currentTime, 0.5);
    if (done) return;
    if (midi === pos.keys[drill.fingers[step]]) {
      setStep(step + 1);
    } else {
      setMistakes((m) => m + 1);
      setWrongKey(midi);
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setWrongKey(null), 400);
    }
  };

  const highlights: Record<number, KeyHighlight> = {};
  if (showHint && !done) highlights[pos.keys[drill.fingers[step]]] = { kind: 'current' };
  if (wrongKey !== null) highlights[wrongKey] = { kind: 'wrong' };

  return (
    <div>
      <div className="tabs">
        {DRILLS.map((d) => (
          <button key={d.id} className={d.id === drillId ? 'selected' : ''} onClick={() => restart(d.id)}>
            {d.title}
          </button>
        ))}
      </div>

      <div className="drill-seq" aria-label="Finger sequence">
        {drill.fingers.map((f, i) => (
          <span key={i} className={`seq-chip${i < step ? ' done' : ''}${i === step ? ' now' : ''}`}>{f}</span>
        ))}
      </div>

      <Keyboard from={pos.range[0]} to={pos.range[1]} highlights={highlights} onKeyPress={press} />

      <p className="explain feedback">
        {done
          ? mistakes === 0
            ? 'Clean run! Now try it again with your real fingers on the CT-S100.'
            : `Finished with ${mistakes} slip${mistakes === 1 ? '' : 's'}. Go again for a clean run.`
          : `Press the key your finger ${drill.fingers[step]} rests on.`}
      </p>
      <div className="row">
        <button onClick={() => restart()}>{done ? 'Again' : 'Restart'}</button>
        <label>
          <input type="checkbox" checked={showHint} onChange={(e) => setShowHint(e.target.checked)} /> Highlight the key (easier)
        </label>
        <span className="muted">Mistakes: {mistakes}</span>
      </div>
    </div>
  );
}
